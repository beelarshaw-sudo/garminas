import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const ReviewSchema = z.object({
  status: z.enum(["VERIFIED", "ADDITIONAL_INFO_REQUIRED", "REJECTED"]),
  note: z.string().optional(),
  additionalInfoRequested: z.string().optional(),
});

/**
 * GET: list all pending community verification submissions for admin review
 */
export async function GET() {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "VERIFIER"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const submissions = await db.communityVerification.findMany({
    where: { status: "PENDING_REVIEW" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          country: true,
          nationality: true,
          profile: { select: { fullName: true } },
        },
      },
      documents: true,
    },
    orderBy: { submittedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ submissions });
}

/**
 * POST: review a community verification submission
 * Admin can: verify, reject, or request additional info
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "VERIFIER"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review." }, { status: 422 });
  }

  const cv = await db.communityVerification.findUnique({ where: { id } });
  if (!cv) {
    return NextResponse.json({ error: "Verification not found." }, { status: 404 });
  }

  await db.communityVerification.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewNote: parsed.data.note,
      additionalInfoRequested: parsed.data.additionalInfoRequested,
      reviewedBy: sess.userId,
      reviewedAt: new Date(),
    },
  });

  // Update user's verification status
  await db.user.update({
    where: { id: cv.userId },
    data: { communityVerificationStatus: parsed.data.status },
  });

  // Notify the user
  const titleMap: Record<string, string> = {
    VERIFIED: "Your Ismaili community verification has been approved.",
    REJECTED: "Your Ismaili community verification could not be approved.",
    ADDITIONAL_INFO_REQUIRED: "Additional information required for verification.",
  };
  const bodyMap: Record<string, string> = {
    VERIFIED: "Your community verification has been verified by an administrator. Your matrimonial profile is now under review.",
    REJECTED: "Your verification submission was not approved. " + (parsed.data.note ?? ""),
    ADDITIONAL_INFO_REQUIRED: "Please provide additional information: " + (parsed.data.additionalInfoRequested ?? ""),
  };

  await db.notification.create({
    data: {
      userId: cv.userId,
      type: "community_verification_" + parsed.data.status.toLowerCase(),
      title: titleMap[parsed.data.status],
      body: bodyMap[parsed.data.status],
      link: "verify",
    },
  });

  await recordAudit({
    userId: sess.userId,
    actorRole: sess.role,
    action: `community_verification_${parsed.data.status.toLowerCase()}`,
    targetType: "community_verification",
    targetId: id,
    metadata: { note: parsed.data.note },
  });

  return NextResponse.json({ ok: true });
}
