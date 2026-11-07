import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const ActionSchema = z.object({
  action: z.enum([
    "view",
    "accept",
    "decline",
    "withdraw",
    "request_introduction",
    "close",
    "family_involve",
  ]),
  reason: z.string().max(500).optional(), // optional share-reason on decline/withdraw
});

function appendStatus(historyJson: string | null, status: string) {
  const arr = historyJson ? JSON.parse(historyJson) : [];
  arr.push({ status, date: new Date().toISOString() });
  return JSON.stringify(arr);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid action." },
      { status: 422 }
    );
  }
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  const proposal = await db.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
  }
  const isSender = proposal.senderId === profile.id;
  const isReceiver = proposal.receiverId === profile.id;
  if (!isSender && !isReceiver) {
    return NextResponse.json(
      { error: "Not authorized to act on this proposal." },
      { status: 403 }
    );
  }

  let newStatus = proposal.status;
  let extra: Record<string, unknown> = {};

  switch (parsed.data.action) {
    case "view":
      if (isReceiver && proposal.status === "DELIVERED") {
        newStatus = "VIEWED";
      } else if (isReceiver && proposal.status === "SENT") {
        newStatus = "VIEWED";
      }
      break;
    case "accept":
      if (!isReceiver) {
        return NextResponse.json(
          { error: "Only the receiver can accept a proposal." },
          { status: 403 }
        );
      }
      if (proposal.status === "DECLINED" || proposal.status === "CLOSED") {
        return NextResponse.json(
          { error: "This proposal is no longer active." },
          { status: 422 }
        );
      }
      newStatus = "ACCEPTED";
      // Create a conversation between the two members
      const existingConv = await db.conversation.findFirst({
        where: {
          OR: [
            { member1Id: profile.id, member2Id: proposal.senderId },
            { member1Id: proposal.senderId, member2Id: profile.id },
          ],
        },
      });
      if (!existingConv) {
        const conv = await db.conversation.create({
          data: {
            member1Id: profile.id,
            member2Id: proposal.senderId,
            proposalId: proposal.id,
          },
        });
        extra.conversationId = conv.id;
      }
      // Notify sender
      await db.notification.create({
        data: {
          userId: (await db.profile.findUnique({ where: { id: proposal.senderId } }))
            ?.userId ?? "",
          type: "interest_accepted",
          title: "Your proposal has been accepted.",
          body: "A member has accepted your matrimonial proposal. You can now begin a respectful conversation.",
          link: "messages",
        },
      });
      break;
    case "decline":
      if (!isReceiver) {
        return NextResponse.json(
          { error: "Only the receiver can decline a proposal." },
          { status: 403 }
        );
      }
      newStatus = "DECLINED";
      // Never disclose reason unless sender chose — here the receiver can leave a reason
      // that is only shared if they opt in. We only persist it as withdrawnReason when
      // the receiver explicitly shares; for now we don't surface to sender.
      if (parsed.data.reason) {
        extra.receiverNote = parsed.data.reason; // not surfaced to sender
      }
      break;
    case "withdraw":
      if (!isSender) {
        return NextResponse.json(
          { error: "Only the sender can withdraw a proposal." },
          { status: 403 }
        );
      }
      newStatus = "CLOSED";
      if (parsed.data.reason) {
        extra.withdrawnReason = parsed.data.reason; // sender chooses to share
      }
      break;
    case "request_introduction":
      if (!isReceiver) {
        return NextResponse.json(
          { error: "Only the receiver can request an introduction." },
          { status: 403 }
        );
      }
      newStatus = "INTRODUCTION_REQUESTED";
      extra.introductionRequested = true;
      break;
    case "family_involve":
      if (!isSender && !isReceiver) break;
      newStatus = "FAMILY_DISCUSSION";
      extra.familyInvolved = true;
      break;
    case "close":
      newStatus = "CLOSED";
      break;
  }

  const updated = await db.proposal.update({
    where: { id },
    data: {
      status: newStatus,
      statusHistory: appendStatus(proposal.statusHistory, newStatus),
      ...extra,
    },
  });

  await recordAudit({
    userId: sess.userId,
    action: `proposal_${parsed.data.action}`,
    targetType: "proposal",
    targetId: proposal.id,
  });

  return NextResponse.json({ ok: true, proposal: updated });
}
