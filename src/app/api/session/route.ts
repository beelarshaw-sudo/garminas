import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, logoutAllDevices } from "@/lib/auth";

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const sessions = await db.session.findMany({
    where: { userId: sess.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    sessions: sessions.map((s) => ({
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    })),
  });
}

export async function POST() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  await logoutAllDevices(sess.userId);
  return NextResponse.json({ ok: true });
}
