import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const total = await db.user.count();
  const verified = await db.verificationRecord.count({
    where: {
      identityVerified: true,
      communityVerified: true,
    },
  });
  const approved = await db.user.count({ where: { isProfileApproved: true } });
  const active = await db.user.count({ where: { status: "ACTIVE" } });
  const proposals = await db.proposal.count();
  const accepted = await db.proposal.count({ where: { status: "ACCEPTED" } });
  const openReports = await db.report.count({ where: { status: "open" } });
  const openTickets = await db.supportTicket.count({
    where: { status: "open" },
  });

  // 30-day registration trend
  const trend: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count = await db.user.count({
      where: { createdAt: { gte: day, lt: next } },
    });
    trend.push({ day: day.toISOString().slice(0, 10), count });
  }

  await recordAudit({
    userId: sess.userId,
    actorRole: sess.role,
    action: "admin_analytics_viewed",
  });
  return NextResponse.json({
    totals: {
      total,
      verified,
      approved,
      active,
      proposals,
      accepted,
      openReports,
      openTickets,
    },
    trend,
  });
}
