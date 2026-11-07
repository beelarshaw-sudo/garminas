import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

async function requireAdmin() {
  const sess = await getCurrentUser();
  if (!sess) return null;
  if (!["ADMIN", "SUPER_ADMIN", "MODERATOR", "VERIFIER"].includes(sess.role)) {
    return null;
  }
  return sess;
}

export async function GET(req: NextRequest) {
  const sess = await requireAdmin();
  if (!sess) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const url = new URL(req.url);
  const search = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status");
  const role = url.searchParams.get("role");

  const users = await db.user.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { email: { contains: search } },
                {
                  profile: { fullName: { contains: search } },
                },
              ],
            }
          : {},
        status ? { status } : {},
        role ? { role } : {},
      ],
    },
    include: {
      profile: {
        include: { verification: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  await recordAudit({
    userId: sess.userId,
    actorRole: sess.role,
    action: "admin_list_members",
  });
  return NextResponse.json({
    members: users.map((u) => ({
      id: u.id,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      profile: u.profile
        ? {
            id: u.profile.id,
            fullName: u.profile.fullName,
            completionPercent: u.profile.completionPercent,
            verification: u.profile.verification,
          }
        : null,
    })),
  });
}
