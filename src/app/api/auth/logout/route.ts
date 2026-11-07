import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { destroySession, getCurrentUser, recordAudit } from "@/lib/auth";

export async function POST() {
  const sess = await getCurrentUser();
  if (sess) {
    await recordAudit({ userId: sess.userId, action: "logout" });
  }
  await destroySession();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  // alias
  return POST();
}
