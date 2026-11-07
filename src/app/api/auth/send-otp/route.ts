import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateOtp, getCurrentUser, rateLimit, isDev, recordAudit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`send-otp:${sess.userId}`, 3, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many OTP requests. Please wait a few minutes." },
      { status: 429 }
    );
  }
  const user = await db.user.findUnique({ where: { id: sess.userId } });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.phoneVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }
  if (!user.phone) {
    return NextResponse.json({ error: "No phone on file." }, { status: 400 });
  }
  const otp = generateOtp();
  await db.user.update({
    where: { id: user.id },
    data: {
      phoneOtpHash: otp,
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  await recordAudit({ userId: user.id, action: "otp_sent", ipAddress: ip });
  // In production: send SMS here. In sandbox: return otp so dev can complete.
  return NextResponse.json({
    ok: true,
    dev: isDev ? { otp } : undefined,
    message: "An OTP has been sent to your registered mobile number.",
  });
}
