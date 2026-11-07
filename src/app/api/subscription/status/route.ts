import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Get the current user's subscription status and payment history.
 */
export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: sess.userId },
    select: {
      subscriptionStatus: true,
      subscriptionPlan: true,
      subscriptionAmount: true,
      subscriptionStartsAt: true,
      subscriptionExpiresAt: true,
      accountType: true,
    },
  });

  const payments = await db.payment.findMany({
    where: { userId: sess.userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const documents = await db.verificationDocument.findMany({
    where: {
      userId: sess.userId,
      type: { in: ["id_card_front", "id_card_back", "electricity_bill"] },
    },
    select: {
      id: true,
      type: true,
      filePath: true,
      reviewStatus: true,
      uploadedAt: true,
    },
  });

  return NextResponse.json({
    subscription: user,
    payments,
    documents,
  });
}
