import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const ProposalSchema = z.object({
  receiverProfileId: z.string().min(1),
  message: z.string().max(800).optional(),
});

// GET proposals involving the user (sent + received)
export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const [sent, received] = await Promise.all([
    db.proposal.findMany({
      where: { senderId: profile.id },
      include: {
        receiver: { select: { fullName: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.proposal.findMany({
      where: { receiverId: profile.id },
      include: {
        sender: { select: { fullName: true, userId: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return NextResponse.json({
    sent: sent.map((p) => ({
      ...p,
      statusHistory: p.statusHistory ? JSON.parse(p.statusHistory) : [],
      counterpartyName: p.receiver.fullName,
      direction: "sent",
    })),
    received: received.map((p) => ({
      ...p,
      statusHistory: p.statusHistory ? JSON.parse(p.statusHistory) : [],
      counterpartyName: p.sender.fullName,
      direction: "received",
    })),
  });
}

// POST: create a new proposal (interest)
export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!sess.profileApproved) {
    return NextResponse.json(
      {
        error:
          "Your account must be approved before you can send proposals. Please complete verification.",
      },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const parsed = ProposalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid proposal.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }
  const sender = await db.profile.findUnique({
    where: { userId: sess.userId },
  });
  if (!sender) {
    return NextResponse.json({ error: "Sender profile not found." }, { status: 404 });
  }
  // Block mass-messaging: max 10 outstanding proposals per day
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recent = await db.proposal.count({
    where: { senderId: sender.id, createdAt: { gt: since } },
  });
  if (recent >= 10) {
    return NextResponse.json(
      {
        error:
          "You have sent many proposals in the last 24 hours. Please wait before sending more.",
      },
      { status: 429 }
    );
  }
  // Receiver must exist + must not be the sender
  if (parsed.data.receiverProfileId === sender.id) {
    return NextResponse.json(
      { error: "You cannot send a proposal to yourself." },
      { status: 422 }
    );
  }
  const receiver = await db.profile.findUnique({
    where: { id: parsed.data.receiverProfileId },
  });
  if (!receiver) {
    return NextResponse.json(
      { error: "Recipient profile not found." },
      { status: 404 }
    );
  }
  // Block-check
  const blocked = await db.block.findFirst({
    where: {
      OR: [
        { blockerId: sess.userId, blockedId: receiver.userId },
        { blockerId: receiver.userId, blockedId: sess.userId },
      ],
    },
  });
  if (blocked) {
    return NextResponse.json(
      { error: "You cannot send a proposal to this member." },
      { status: 403 }
    );
  }
  // De-dupe: no existing active proposal
  const existing = await db.proposal.findFirst({
    where: {
      senderId: sender.id,
      receiverId: receiver.id,
      status: { notIn: ["CLOSED", "DECLINED", "WITHDRAWN"] },
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An active proposal already exists with this member." },
      { status: 409 }
    );
  }

  const statusHistory = JSON.stringify([
    { status: "SENT", date: new Date().toISOString() },
  ]);
  const proposal = await db.proposal.create({
    data: {
      senderId: sender.id,
      receiverId: receiver.id,
      message: parsed.data.message,
      status: "SENT",
      statusHistory,
    },
  });

  // Notify receiver (masked body — no matrimonial info in preview)
  await db.notification.create({
    data: {
      userId: receiver.userId,
      type: "proposal_received",
      title: "You have received a new matrimonial proposal.",
      body: "A member has expressed interest in your profile. Open GarMinas to review.",
      link: "proposals",
    },
  });
  await recordAudit({
    userId: sess.userId,
    action: "proposal_sent",
    targetType: "proposal",
    targetId: proposal.id,
  });
  return NextResponse.json({ ok: true, proposalId: proposal.id });
}
