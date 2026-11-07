import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const Schema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  note: z.string().optional(),
});

/**
 * Admin: approve or reject a registration document.
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
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid." }, { status: 422 });
  }

  const doc = await db.verificationDocument.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const updated = await db.verificationDocument.update({
    where: { id },
    data: {
      reviewStatus: parsed.data.status,
      reviewNote: parsed.data.note,
      reviewedBy: sess.userId,
    },
  });

  await recordAudit({
    userId: sess.userId,
    actorRole: sess.role,
    action: `document_${parsed.data.status.toLowerCase()}`,
    targetType: "document",
    targetId: id,
    metadata: { note: parsed.data.note },
  });

  return NextResponse.json({ ok: true, document: updated });
}
