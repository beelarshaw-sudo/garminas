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
  return NextResponse.json({
    session: {
      ...sess,
      profileComplete: profile?.completionPercent ?? 0,
      fullName: profile?.fullName,
      profileId: profile?.id,
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
