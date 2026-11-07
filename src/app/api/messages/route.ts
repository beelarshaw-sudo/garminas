import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit, rateLimit } from "@/lib/auth";

const MsgSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1).max(2000),
  attachments: z.array(z.string()).max(2).optional(),
});

export async function GET(req: NextRequest) {
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
  const conversations = await db.conversation.findMany({
    where: {
      OR: [{ member1Id: profile.id }, { member2Id: profile.id }],
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });
  const out = conversations.map((c) => {
    const otherId = c.member1Id === profile.id ? c.member2Id : c.member1Id;
    return {
      id: c.id,
      otherProfileId: otherId,
      lastUpdated: c.updatedAt,
      messages: c.messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderType: m.senderType,
        body: m.body,
        attachments: m.attachments ? JSON.parse(m.attachments) : [],
        createdAt: m.createdAt,
        readByReceiver: m.readByReceiver,
      })),
    };
  });
  return NextResponse.json({ conversations: out });
}

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!sess.profileApproved) {
    return NextResponse.json(
      { error: "Account must be approved to send messages." },
      { status: 403 }
    );
  }
  // Subscription gate
  const msgUser = await db.user.findUnique({
    where: { id: sess.userId },
    select: { subscriptionStatus: true, subscriptionExpiresAt: true },
  });
  const subActive =
    msgUser?.subscriptionStatus === "ACTIVE" &&
    msgUser.subscriptionExpiresAt &&
    msgUser.subscriptionExpiresAt > new Date();
  if (!subActive) {
    return NextResponse.json(
      {
        error: "An active subscription is required to send messages.",
        subscriptionRequired: true,
      },
      { status: 403 }
    );
  }
  const body = await req.json().catch(() => ({}));
  const parsed = MsgSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid message." },
      { status: 422 }
    );
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`msg:${sess.userId}`, 30, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "You are sending messages too quickly. Please slow down." },
      { status: 429 }
    );
  }

  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const conv = await db.conversation.findUnique({
    where: { id: parsed.data.conversationId },
  });
  if (!conv) {
    return NextResponse.json(
      { error: "Conversation not found." },
      { status: 404 }
    );
  }
  if (conv.member1Id !== profile.id && conv.member2Id !== profile.id) {
    return NextResponse.json(
      { error: "Not authorized in this conversation." },
      { status: 403 }
    );
  }
  const msg = await db.message.create({
    data: {
      conversationId: conv.id,
      senderId: profile.id,
      senderType: "member",
      body: parsed.data.body,
      attachments: parsed.data.attachments
        ? JSON.stringify(parsed.data.attachments)
        : null,
    },
  });
  await db.conversation.update({
    where: { id: conv.id },
    data: { updatedAt: new Date() },
  });
  await recordAudit({
    userId: sess.userId,
    action: "message_sent",
    targetType: "conversation",
    targetId: conv.id,
    ipAddress: ip,
  });
  return NextResponse.json({ ok: true, messageId: msg.id });
}
