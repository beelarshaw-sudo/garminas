import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const PaymentSchema = z.object({
  method: z.enum([
    "EASYPAISA",
    "JAZZCASH",
    "SADAPAY",
    "BANK_TRANSFER",
    "CREDIT_CARD",
  ]),
  transactionRef: z.string().min(3, "Transaction reference is required."),
  receiptPath: z.string().min(1, "Payment screenshot is required for verification."),
  currency: z.string().optional(), // e.g. "USD", "AED"
  amountLocal: z.number().optional(), // amount in local currency
  exchangeRate: z.number().optional(), // PKR→currency rate at time of payment
});

/**
 * Submit a subscription payment (5000 PKR/month).
 * The user uploads a receipt (via /api/upload?type=payment_receipt) and
 * enters their transaction reference. An admin verifies the payment and
 * activates the subscription.
 */
export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = PaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payment details.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }

  const d = parsed.data;
  const payment = await db.payment.create({
    data: {
      userId: sess.userId,
      amount: 5000, // base PKR
      amountLocal: d.amountLocal,
      currency: d.currency,
      exchangeRate: d.exchangeRate,
      plan: "MONTHLY",
      method: d.method,
      transactionRef: d.transactionRef,
      receiptPath: d.receiptPath,
      status: "PENDING",
    },
  });

  // Update user's subscription status to PENDING
  await db.user.update({
    where: { id: sess.userId },
    data: {
      subscriptionStatus: "PENDING",
      subscriptionPaymentRef: d.transactionRef,
    },
  });

  await recordAudit({
    userId: sess.userId,
    action: "subscription_payment_submitted",
    targetType: "payment",
    targetId: payment.id,
    metadata: { amount: 5000, method: d.method },
  });

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    message:
      "Your payment of 5000 PKR has been submitted for verification. An administrator will review and activate your subscription shortly.",
  });
}
