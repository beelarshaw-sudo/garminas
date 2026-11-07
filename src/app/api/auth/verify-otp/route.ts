import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, rateLimit, recordAudit } from "@/lib/auth";

const Schema = z.object({ otp: z.string().length(6) });

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid OTP." }, { status: 422 });
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`verify-otp:${sess.userId}`, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please request a new OTP." },
      { status: 429 }
    );
  }

  const user = await db.user.findUnique({ where: { id: sess.userId } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.phoneVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }
  if (
    user.phoneOtpHash !== parsed.data.otp ||
    (user.phoneOtpExpires && user.phoneOtpExpires < new Date())
  ) {
    return NextResponse.json({ error: "Invalid or expired OTP." }, { status: 400 });
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      phoneVerified: true,
      phoneOtpHash: null,
      phoneOtpExpires: null,
    },
  });
  const prof = await db.profile.findUnique({ where: { userId: user.id } });
  if (prof) {
    await db.verificationRecord.update({
      where: { profileId: prof.id },
      data: { phoneVerified: true },
    });
  }
  await recordAudit({ userId: user.id, action: "phone_verified", ipAddress: ip });
  return NextResponse.json({ ok: true });
}
