import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const ActionSchema = z.object({
  action: z.enum([
    "approve_profile",
    "reject_profile",
    "suspend",
    "reinstate",
    "ban",
    "set_role",
  ]),
  role: z
    .enum(["MEMBER", "MODERATOR", "VERIFIER", "ADMIN", "SUPER_ADMIN"])
    .optional(),
});

async function requireAdminWithPerm(perm: "members" | "admins") {
  const sess = await getCurrentUser();
  if (!sess) return null;
  if (!["ADMIN", "SUPER_ADMIN"].includes(sess.role)) return null;
  return sess;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sess = await requireAdminWithPerm("members");
  if (!sess) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = ActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action." }, { status: 422 });
  }
  const target = await db.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  switch (parsed.data.action) {
    case "approve_profile":
      await db.user.update({
        where: { id },
        data: { isProfileApproved: true, status: "ACTIVE" },
      });
      const prof = await db.profile.findUnique({ where: { userId: id } });
      if (prof && prof.verification) {
        await db.verificationRecord.update({
          where: { profileId: prof.id },
          data: {
            profileApproved: true,
            profileApprovedAt: new Date(),
            profileReviewerId: sess.userId,
          },
        });
      } else if (prof) {
        await db.verificationRecord.upsert({
          where: { profileId: prof.id },
          create: {
            profileId: prof.id,
            profileApproved: true,
            profileApprovedAt: new Date(),
            profileReviewerId: sess.userId,
          },
          update: {
            profileApproved: true,
            profileApprovedAt: new Date(),
            profileReviewerId: sess.userId,
          },
        });
      }
      await db.notification.create({
        data: {
          userId: id,
          type: "profile_approval",
          title: "Your profile has been approved.",
          body: "You can now discover members and send matrimonial proposals.",
          link: "discover",
        },
      });
      break;
    case "reject_profile":
      await db.user.update({
        where: { id },
        data: { isProfileApproved: false, status: "PENDING" },
      });
      break;
    case "suspend":
      await db.user.update({
        where: { id },
        data: { status: "SUSPENDED" },
      });
      break;
    case "reinstate":
      await db.user.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
      break;
    case "ban":
      await db.user.update({
        where: { id },
        data: { status: "BANNED" },
      });
      break;
    case "set_role":
      if (!parsed.data.role) {
        return NextResponse.json({ error: "Role required." }, { status: 422 });
      }
      await db.user.update({
        where: { id },
        data: { role: parsed.data.role },
      });
      break;
  }
  await recordAudit({
    userId: sess.userId,
    actorRole: sess.role,
    action: `admin_${parsed.data.action}`,
    targetType: "user",
    targetId: id,
  });
  return NextResponse.json({ ok: true });
}
