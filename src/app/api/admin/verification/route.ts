import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const Schema = z.object({
  type: z.enum(["identity", "community", "profile"]),
  approved: z.boolean(),
  note: z.string().max(1000).optional(),
});

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "VERIFIER"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const records = await db.verificationRecord.findMany({
    where: {
      OR: [
        { identityVerified: false },
        { communityVerified: false },
        { profileApproved: false },
      ],
    },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ records });
}

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "VERIFIER"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid." }, { status: 422 });
  }
  const url = new URL(req.url);
  const recordId = url.searchParams.get("recordId");
  if (!recordId) {
    return NextResponse.json({ error: "recordId required." }, { status: 422 });
  }
  const rec = await db.verificationRecord.findUnique({
    where: { id: recordId },
  });
  if (!rec) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }
  const update: Record<string, unknown> = {};
  const approved = parsed.data.approved;
  if (parsed.data.type === "identity") {
    update.identityVerified = approved;
    update.identityVerifiedAt = approved ? new Date() : null;
    update.identityReviewerId = sess.userId;
  }
  if (parsed.data.type === "community") {
    update.communityVerified = approved;
    update.communityVerifiedAt = approved ? new Date() : null;
    update.communityReviewerId = sess.userId;
    update.communityMethod = "authorized_review_board";
  }
  if (parsed.data.type === "profile") {
    update.profileApproved = approved;
    update.profileApprovedAt = approved ? new Date() : null;
    update.profileReviewerId = sess.userId;
    await db.user.update({
      where: { id: rec.profile?.userId ?? "" },
      data: { isProfileApproved: approved },
    });
  }
  // Append reviewer note
  const notes = rec.reviewerNotes ? JSON.parse(rec.reviewerNotes) : [];
  if (parsed.data.note) {
    notes.push({
      reviewer: sess.userId,
      note: parsed.data.note,
      date: new Date().toISOString(),
    });
    update.reviewerNotes = JSON.stringify(notes);
  }
  const updated = await db.verificationRecord.update({
    where: { id: recordId },
    data: update,
  });
  await recordAudit({
    userId: sess.userId,
    actorRole: sess.role,
    action: `verify_${parsed.data.type}_${approved ? "approved" : "rejected"}`,
    targetType: "verification",
    targetId: recordId,
    metadata: { note: parsed.data.note },
  });
  return NextResponse.json({ ok: true, record: updated });
}
