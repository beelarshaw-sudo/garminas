import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, recordAudit } from "@/lib/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * File upload endpoint for registration documents and payment receipts.
 *
 * Works both authenticated (payment receipts) and unauthenticated
 * (registration documents — the user doesn't have an account yet).
 *
 * For unauthenticated uploads, the file is stored and a path is returned.
 * The path is then passed to /api/auth/register, which links the documents
 * to the newly created user.
 *
 * In production, replace local storage with private object storage (S3, etc.)
 * and serve files through authenticated, short-lived signed URLs.
 */
export async function POST(req: NextRequest) {
  // Try to get the current user (optional — works for both authed and anon)
  const sess = await getCurrentUser();

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const docType = formData.get("type") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!docType) {
    return NextResponse.json({ error: "Document type required." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type ${file.type} is not allowed. Please upload a JPEG, PNG, or WebP image.` },
      { status: 422 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File is too large. Maximum size is 5 MB." },
      { status: 422 }
    );
  }

  // Generate a unique, unpredictable filename to prevent path traversal
  const prefix = sess?.userId || "anon";
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const randomName = `${prefix}-${docType}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, randomName);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  const publicPath = `/uploads/${randomName}`;

  // If authenticated AND it's not a payment receipt, create a document record now
  if (sess && docType !== "payment_receipt") {
    await db.verificationDocument.create({
      data: {
        userId: sess.userId,
        type: docType,
        filePath: publicPath,
        mimeType: file.type,
        reviewStatus: "PENDING",
      },
    });
    await recordAudit({
      userId: sess.userId,
      action: `document_uploaded:${docType}`,
      targetType: "document",
      targetId: publicPath,
    });
  }

  return NextResponse.json({ ok: true, path: publicPath, type: docType });
}
