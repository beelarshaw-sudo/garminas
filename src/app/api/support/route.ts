import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const TicketSchema = z.object({
  category: z.string().min(2),
  subject: z.string().min(2).max(200),
  message: z.string().min(2).max(4000),
});

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const tickets = await db.supportTicket.findMany({
    where: { userId: sess.userId },
    include: { responses: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = TicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid ticket.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }
  const ticket = await db.supportTicket.create({
    data: {
      userId: sess.userId,
      category: parsed.data.category,
      subject: parsed.data.subject,
      message: parsed.data.message,
      status: "open",
    },
  });
  await recordAudit({
    userId: sess.userId,
    action: "support_ticket_created",
    targetType: "support_ticket",
    targetId: ticket.id,
  });
  return NextResponse.json({ ok: true, ticketId: ticket.id });
}
