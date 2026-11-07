import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSession, rateLimit, recordAudit } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 422 });
  }
  const { email, password } = parsed.data;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit: 5 attempts per 15 minutes per IP+email
  const rl = rateLimit(`login:${ip}:${email.toLowerCase()}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: "Account temporarily locked. Try again later." },
      { status: 423 }
    );
  }
  if (user.status === "DELETED" || user.status === "BANNED") {
    return NextResponse.json(
      { error: "This account is no longer available." },
      { status: 403 }
    );
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    const lockUntil =
      attempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: attempts,
        lockedUntil: lockUntil,
      },
    });
    await recordAudit({
      userId: user.id,
      action: "login_failed",
      ipAddress: ip,
    });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
  await createSession(user.id);
  await recordAudit({ userId: user.id, action: "login", ipAddress: ip });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  // Provide a quick health probe.
  return NextResponse.json({ ok: true });
}
