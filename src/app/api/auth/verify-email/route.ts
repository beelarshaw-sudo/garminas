import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, rateLimit, recordAudit } from "@/lib/auth";

const Schema = z.object({ token: z.string().min(10) });

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token." }, { status: 422 });
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`verify-email:${sess.userId}`, 10, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try later." },
      { status: 429 }
    );
  }

  const user = await db.user.findUnique({ where: { id: sess.userId } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }
  if (
    user.emailVerifyToken !== parsed.data.token ||
    (user.emailVerifyExpires && user.emailVerifyExpires < new Date())
  ) {
    return NextResponse.json(
      { error: "Invalid or expired verification link." },
      { status: 400 }
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifyToken: null,
      emailVerifyExpires: null,
    },
  });
  const prof = await db.profile.findUnique({ where: { userId: user.id } });
  if (prof) {
    await db.verificationRecord.update({
      where: { profileId: prof.id },
      data: { emailVerified: true },
    });
  }
  await recordAudit({ userId: user.id, action: "email_verified", ipAddress: ip });
  return NextResponse.json({ ok: true });
}
