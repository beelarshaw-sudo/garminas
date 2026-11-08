import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ session: null }, { status: 200 });
  }
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
    select: { id: true, fullName: true, completionPercent: true },
  });
  const verification = profile
    ? await db.verificationRecord.findUnique({
        where: { profileId: profile.id },
      })
    : null;
  // Include subscription status so the frontend can gate features
  const user = await db.user.findUnique({
    where: { id: sess.userId },
    select: {
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      accountType: true,
      country: true,
      nationality: true,
      currency: true,
      callingCode: true,
      region: true,
      applicationStatus: true,
      communityVerificationStatus: true,
    },
  });
  const subActive =
    user?.subscriptionStatus === "ACTIVE" &&
    user.subscriptionExpiresAt &&
    user.subscriptionExpiresAt > new Date();
  return NextResponse.json({
    session: {
      ...sess,
      profileComplete: profile?.completionPercent ?? 0,
      fullName: profile?.fullName,
      profileId: profile?.id,
      accountType: user?.accountType ?? "INDIVIDUAL",
      subscriptionActive: !!subActive,
      subscriptionStatus: user?.subscriptionStatus ?? "NONE",
      subscriptionExpiresAt: user?.subscriptionExpiresAt,
      country: user?.country,
      nationality: user?.nationality,
      currency: user?.currency,
      callingCode: user?.callingCode,
      region: user?.region,
      applicationStatus: user?.applicationStatus ?? "NOT_STARTED",
      communityVerificationStatus: user?.communityVerificationStatus ?? "NOT_SUBMITTED",
      verification: verification
        ? {
            emailVerified: verification.emailVerified || sess.emailVerified,
            phoneVerified: verification.phoneVerified,
            identityVerified: verification.identityVerified,
            communityVerified: verification.communityVerified,
            profileApproved: verification.profileApproved,
          }
        : null,
    },
  });
}
