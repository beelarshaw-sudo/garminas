import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const Schema = z.object({
  hideProfile: z.boolean().optional(),
  inactivityPause: z.boolean().optional(),
  photoVisibility: z
    .enum(["PUBLIC_APPROVED", "APPROVED_ONLY", "AFTER_INTRODUCTION", "HIDDEN"])
    .optional(),
  profileVisibility: z
    .enum(["PUBLIC_APPROVED", "APPROVED_ONLY", "AFTER_INTRODUCTION", "HIDDEN"])
    .optional(),
  appearsInSearch: z.boolean().optional(),
  onlineStatusVisible: z.boolean().optional(),
  readReceiptsEnabled: z.boolean().optional(),
  familyInfoVisible: z.boolean().optional(),
});

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
  });
  const user = await db.user.findUnique({
    where: { id: sess.userId },
    select: { isHidden: true, isInactivityPaused: true },
  });
  if (!profile || !user) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  return NextResponse.json({
    privacy: {
      hideProfile: user.isHidden,
      inactivityPause: user.isInactivityPaused,
      photoVisibility: profile.photoVisibility,
      profileVisibility: profile.profileVisibility,
      appearsInSearch: profile.appearsInSearch,
      onlineStatusVisible: profile.onlineStatusVisible,
      readReceiptsEnabled: profile.readReceiptsEnabled,
      familyInfoVisible: profile.familyInfoVisible,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid privacy settings." }, { status: 422 });
  }
  const d = parsed.data;
  if (d.hideProfile != null) {
    await db.user.update({
      where: { id: sess.userId },
      data: { isHidden: d.hideProfile },
    });
  }
  if (d.inactivityPause != null) {
    await db.user.update({
      where: { id: sess.userId },
      data: { isInactivityPaused: d.inactivityPause },
    });
  }
  const { hideProfile, inactivityPause, ...profileData } = d;
  if (Object.keys(profileData).length > 0) {
    await db.profile.update({
      where: { userId: sess.userId },
      data: profileData,
    });
  }
  return NextResponse.json({ ok: true });
}
