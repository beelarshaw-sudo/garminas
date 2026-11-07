import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const Schema = z.object({
  status: z.enum(["VERIFIED", "REJECTED"]),
});

/**
 * Admin: verify or reject a subscription payment.
 * If verified, activates the user's subscription for 30 days.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid." }, { status: 422 });
  }

  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (parsed.data.status === "VERIFIED") {
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.payment.update({
      where: { id },
      data: {
        status: "VERIFIED",
        verifiedBy: sess.userId,
        verifiedAt: now,
      },
    });

    await db.user.update({
      where: { id: payment.userId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionStartsAt: now,
        subscriptionExpiresAt: expires,
      },
    });

    // Notify the user
    await db.notification.create({
      data: {
        userId: payment.userId,
        type: "subscription_activated",
        title: "Your subscription is now active.",
        body: `Your monthly subscription (5000 PKR) has been verified and is active until ${expires.toLocaleDateString()}.`,
        link: "dashboard",
      },
    });

    await recordAudit({
      userId: sess.userId,
      actorRole: sess.role,
      action: "payment_verified",
      targetType: "payment",
      targetId: id,
      metadata: { amount: payment.amount },
    });
  } else {
    await db.payment.update({
      where: { id },
      data: {
        status: "REJECTED",
        verifiedBy: sess.userId,
        verifiedAt: new Date(),
      },
    });
    await db.user.update({
      where: { id: payment.userId },
      data: { subscriptionStatus: "NONE" },
    });
    await db.notification.create({
      data: {
        userId: payment.userId,
        type: "subscription_rejected",
        title: "Your payment could not be verified.",
        body: "Please check your payment details and try again, or contact support.",
        link: "dashboard",
      },
    });
    await recordAudit({
      userId: sess.userId,
      actorRole: sess.role,
      action: "payment_rejected",
      targetType: "payment",
      targetId: id,
    });
  }

  return NextResponse.json({ ok: true });
}
