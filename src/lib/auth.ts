import bcrypt from "bcryptjs";
import { db } from "./db";
import { cookies } from "next/headers";
import crypto from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<{
  hash: string;
  salt: string;
}> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(password, salt);
  return { hash, salt };
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

// Strong-password check (OWASP-aligned).
export function isStrongPassword(p: string): {
  ok: boolean;
  reason?: string;
} {
  if (p.length < 10) return { ok: false, reason: "At least 10 characters." };
  if (!/[A-Z]/.test(p)) return { ok: false, reason: "At least one uppercase letter." };
  if (!/[a-z]/.test(p)) return { ok: false, reason: "At least one lowercase letter." };
  if (!/[0-9]/.test(p)) return { ok: false, reason: "At least one digit." };
  if (!/[^A-Za-z0-9]/.test(p))
    return { ok: false, reason: "At least one special character." };
  return { ok: true };
}

export function generateOtp(): string {
  // 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// In sandbox, OTP is returned from the API so the dev can see it.
// In production, OTP is only ever sent via SMS — never returned to client.
export const isDev = process.env.NODE_ENV !== "production";

export interface AuthSession {
  userId: string;
  email: string;
  role: string;
  status: string;
  profileApproved: boolean;
}

const SESSION_COOKIE = "garminas_session";
const SESSION_DAYS = 7;

export async function createSession(userId: string): Promise<void> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.session.create({
    data: { userId, sessionToken: token, expiresAt },
  });
  const c = await cookies();
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: !isDev,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function destroySession(): Promise<void> {
  const c = await cookies();
  const token = c.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { sessionToken: token } });
  }
  c.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<AuthSession | null> {
  try {
    const c = await cookies();
    const token = c.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await db.session.delete({ where: { id: session.id } });
      return null;
    }
    const u = session.user;
    return {
      userId: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      profileApproved: u.isProfileApproved,
    };
  } catch {
    return null;
  }
}

export async function logoutAllDevices(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
  const c = await cookies();
  c.delete(SESSION_COOKIE);
}

// Rate-limiting: simple in-memory bucket per identifier.
// Not suitable for multi-instance production — replace with Redis.
const rateBuckets = new Map<string, { count: number; firstAt: number }>();

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): { ok: boolean; retryInMs: number } {
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || now - b.firstAt > windowMs) {
    rateBuckets.set(key, { count: 1, firstAt: now });
    return { ok: true, retryInMs: 0 };
  }
  b.count++;
  if (b.count > max) {
    return { ok: false, retryInMs: windowMs - (now - b.firstAt) };
  }
  return { ok: true, retryInMs: 0 };
}

export async function recordAudit(params: {
  userId?: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: params.userId,
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        ipAddress: params.ipAddress,
      },
    });
  } catch {
    // audit log must never break the request
  }
}
