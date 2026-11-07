import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET: a member's own verification status
export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
    include: { verification: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const v = profile.verification;
  return NextResponse.json({
    verification: v
      ? {
          emailVerified: v.emailVerified,
          phoneVerified: v.phoneVerified,
          identityVerified: v.identityVerified,
          communityVerified: v.communityVerified,
          profileApproved: v.profileApproved,
          communityConsent: v.communityConsent,
          status: v.status,
        }
      : null,
  });
}

// PATCH: member records community-eligibility consent (no documents by default)
export async function PATCH(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
    include: { verification: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const v =
    profile.verification ??
    (await db.verificationRecord.create({
      data: { profileId: profile.id, communityConsent: false },
    }));
  const update: Record<string, unknown> = {};
  if (typeof body.communityConsent === "boolean") {
    update.communityConsent = body.communityConsent;
  }
  if (body.identityDocumentRef) {
    // In production this would be a private object-storage key, never
    // surfaced to the client. For sandbox we accept a reference and store it.
    update.status = "IN_REVIEW";
  }
  const updated = await db.verificationRecord.update({
    where: { profileId: profile.id },
    data: update,
  });
  return NextResponse.json({ ok: true, verification: updated });
}
