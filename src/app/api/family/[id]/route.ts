import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const { id } = await params;
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const rep = await db.familyRep.findUnique({ where: { id } });
  if (!rep || rep.profileId !== profile.id) {
    return NextResponse.json(
      { error: "Family representative not found or not authorized." },
      { status: 404 }
    );
  }
  await db.familyRep.update({
    where: { id },
    data: { status: "revoked" },
  });
  await recordAudit({
    userId: sess.userId,
    action: "family_rep_revoked",
    targetType: "family_rep",
    targetId: rep.id,
  });
  return NextResponse.json({ ok: true });
}
