import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const SubmitSchema = z.object({
  photoPath: z.string().optional(),
  photoDescription: z.string().optional(),
  documentPath: z.string().optional(),
  documentType: z.string().optional(),
  additionalEvidencePath: z.string().optional(),
  writtenExplanation: z.string().optional(),
}).refine(
  (data) => data.photoPath || data.documentPath || data.additionalEvidencePath || data.writtenExplanation,
  { message: "At least one form of verification evidence is required." }
);

/**
 * GET: retrieve the current user's community verification status
 */
export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const cv = await db.communityVerification.findUnique({
    where: { userId: sess.userId },
    include: { documents: true },
  });

  return NextResponse.json({ verification: cv });
}

/**
 * POST: submit Ismaili community verification evidence
 * Accepts:
 *   Option A: Photograph in an Ismaili community setting (photoPath + photoDescription)
 *   Option B: Supporting documentation (documentPath + documentType)
 *   Option C: Additional verification (additionalEvidencePath + writtenExplanation)
 */
export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
      { status: 422 }
    );
  }

  const d = parsed.data;

  // Upsert the community verification record
  const cv = await db.communityVerification.upsert({
    where: { userId: sess.userId },
    create: {
      userId: sess.userId,
      status: "PENDING_REVIEW",
      photoPath: d.photoPath,
      photoDescription: d.photoDescription,
      documentPath: d.documentPath,
      documentType: d.documentType,
      additionalEvidencePath: d.additionalEvidencePath,
      writtenExplanation: d.writtenExplanation,
      submittedAt: new Date(),
    },
    update: {
      status: "PENDING_REVIEW",
      photoPath: d.photoPath,
      photoDescription: d.photoDescription,
      documentPath: d.documentPath,
      documentType: d.documentType,
      additionalEvidencePath: d.additionalEvidencePath,
      writtenExplanation: d.writtenExplanation,
      submittedAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      additionalInfoRequested: null,
    },
  });

  // Update user's verification status
  await db.user.update({
    where: { id: sess.userId },
    data: { communityVerificationStatus: "PENDING_REVIEW" },
  });

  // Create VerificationDocument records for each uploaded file
  const docsToCreate: { type: string; filePath: string; communityVerificationId: string; userId: string | null }[] = [];
  if (d.photoPath) docsToCreate.push({ type: "community_photo", filePath: d.photoPath, communityVerificationId: cv.id, userId: null });
  if (d.documentPath) docsToCreate.push({ type: "community_document", filePath: d.documentPath, communityVerificationId: cv.id, userId: null });
  if (d.additionalEvidencePath) docsToCreate.push({ type: "additional_evidence", filePath: d.additionalEvidencePath, communityVerificationId: cv.id, userId: null });

  if (docsToCreate.length > 0) {
    // Delete old documents linked to this CV
    await db.verificationDocument.deleteMany({
      where: { communityVerificationId: cv.id },
    });
    await db.verificationDocument.createMany({
      data: docsToCreate.map((d) => ({
        type: d.type,
        filePath: d.filePath,
        mimeType: "image/jpeg",
        communityVerificationId: d.communityVerificationId,
      })),
    });
  }

  await recordAudit({
    userId: sess.userId,
    action: "community_verification_submitted",
    targetType: "community_verification",
    targetId: cv.id,
  });

  return NextResponse.json({
    ok: true,
    status: "PENDING_REVIEW",
    message:
      "Your Ismaili community verification evidence has been submitted for review. An administrator will review it shortly. You will be notified once a decision is made.",
  });
}
