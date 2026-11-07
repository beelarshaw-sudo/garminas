import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, logoutAllDevices, recordAudit } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  if (action === "deactivate") {
    await db.user.update({
      where: { id: sess.userId },
      data: { status: "DEACTIVATED", isInactivityPaused: true },
    });
    await logoutAllDevices(sess.userId);
    await recordAudit({ userId: sess.userId, action: "account_deactivated" });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete") {
    // Permanent deletion. We mark DELETED and purge identifiable fields.
    // Verification documents would be purged per retention policy in production.
    await db.user.update({
      where: { id: sess.userId },
      data: {
        status: "DELETED",
        email: `deleted+${sess.userId}@garminas.invalid`,
        phone: null,
        passwordHash: "[deleted]",
        passwordSalt: "[deleted]",
        emailVerifyToken: null,
        phoneOtpHash: null,
      },
    });
    await db.profile.updateMany({
      where: { userId: sess.userId },
      data: {
        fullName: "[Deleted member]",
        aboutMe: null,
        photos: null,
        primaryPhoto: null,
        photoVisibility: "HIDDEN",
        profileVisibility: "HIDDEN",
        appearsInSearch: false,
      },
    });
    await db.verificationDocument.deleteMany({
      where: {
        verification: { profile: { userId: sess.userId } },
      },
    });
    await logoutAllDevices(sess.userId);
    await recordAudit({ userId: sess.userId, action: "account_deleted" });
    return NextResponse.json({ ok: true });
  }
  if (action === "export") {
    const user = await db.user.findUnique({
      where: { id: sess.userId },
      include: {
        profile: { include: { preferences: true, verification: true } },
        notifications: true,
        privacyConsents: true,
      },
    });
    return NextResponse.json({ export: user });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
