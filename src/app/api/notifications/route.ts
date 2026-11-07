import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const notes = await db.notification.findMany({
    where: { userId: sess.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notes.filter((n) => !n.read).length;
  return NextResponse.json({ notifications: notes, unread });
}

export async function PATCH(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.markAllRead) {
    await db.notification.updateMany({
      where: { userId: sess.userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }
  if (body.id) {
    await db.notification.update({
      where: { id: body.id },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }
  if (body.preferences) {
    // preferences are per-notification-type via User table or PlatformConfig
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ ok: true });
}
