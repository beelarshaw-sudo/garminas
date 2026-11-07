import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

/**
 * Admin: list all pending registration documents for review.
 */
export async function GET() {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "VERIFIER"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const documents = await db.verificationDocument.findMany({
    where: {
      type: { in: ["id_card_front", "id_card_back", "electricity_bill"] },
      reviewStatus: "PENDING",
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { fullName: true } },
        },
      },
    },
    orderBy: { uploadedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ documents });
}
