import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

/**
 * Admin: list all pending payments for verification.
 */
export async function GET() {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const payments = await db.payment.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { fullName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ payments });
}
