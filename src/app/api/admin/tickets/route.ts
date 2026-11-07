import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const tickets = await db.supportTicket.findMany({
    include: {
      user: { select: { email: true } },
      responses: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ tickets });
}

export async function PATCH(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { ticketId, body: responseBody, status } = body as {
    ticketId: string;
    body?: string;
    status?: string;
  };
  if (!ticketId) {
    return NextResponse.json({ error: "ticketId required." }, { status: 422 });
  }
  const ticket = await db.supportTicket.findUnique({
    where: { id: ticketId },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
  }
  if (responseBody) {
    await db.supportTicketResponse.create({
      data: {
        ticketId,
        responderId: sess.userId,
        responderRole: sess.role,
        body: responseBody,
      },
    });
    await db.supportTicket.update({
      where: { id: ticketId },
      data: { status: status ?? "in_progress", updatedAt: new Date() },
    });
    await db.notification.create({
      data: {
        userId: ticket.userId,
        type: "support_response",
        title: "Your support ticket has been updated.",
        body: "GarMinas support has responded to your request.",
        link: "help",
      },
    });
  } else if (status) {
    await db.supportTicket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() },
    });
  }
  await recordAudit({
    userId: sess.userId,
    actorRole: sess.role,
    action: "support_ticket_responded",
    targetType: "support_ticket",
    targetId: ticketId,
  });
  return NextResponse.json({ ok: true });
}
