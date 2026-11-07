import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const BlockSchema = z.object({ blockedUserId: z.string().min(1) });

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const blocks = await db.block.findMany({
    where: { blockerId: sess.userId },
    include: { blocked: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    blocks: blocks.map((b) => ({ id: b.id, blockedId: b.blockedId, createdAt: b.createdAt })),
  });
}

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = BlockSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid block." }, { status: 422 });
  }
  if (parsed.data.blockedUserId === sess.userId) {
    return NextResponse.json({ error: "Cannot block yourself." }, { status: 422 });
  }
  try {
    const block = await db.block.create({
      data: { blockerId: sess.userId, blockedId: parsed.data.blockedUserId },
    });
    await recordAudit({
      userId: sess.userId,
      action: "member_blocked",
      targetType: "user",
      targetId: parsed.data.blockedUserId,
    });
    return NextResponse.json({ ok: true, blockId: block.id });
  } catch {
    return NextResponse.json({ ok: true, alreadyBlocked: true });
  }
}

export async function DELETE(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const url = new URL(req.url);
  const blockedUserId = url.searchParams.get("blockedUserId");
  if (!blockedUserId) {
    return NextResponse.json({ error: "blockedUserId required." }, { status: 422 });
  }
  await db.block.deleteMany({
    where: { blockerId: sess.userId, blockedId: blockedUserId },
  });
  await recordAudit({
    userId: sess.userId,
    action: "member_unblocked",
    targetType: "user",
    targetId: blockedUserId,
  });
  return NextResponse.json({ ok: true });
}
