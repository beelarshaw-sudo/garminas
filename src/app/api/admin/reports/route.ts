import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const reports = await db.report.findMany({
    include: {
      reporter: { select: { email: true } },
      subject: { select: { email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ reports });
}

export async function PATCH(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess || !["ADMIN", "SUPER_ADMIN", "MODERATOR"].includes(sess.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const { reportId, status, resolution } = body as {
    reportId: string;
    status: string;
    resolution?: string;
  };
  if (!reportId || !status) {
    return NextResponse.json({ error: "Invalid." }, { status: 422 });
  }
  const updated = await db.report.update({
    where: { id: reportId },
    data: {
      status,
      resolution,
      resolvedById: sess.userId,
    },
  });
  await recordAudit({
    userId: sess.userId,
    actorRole: sess.role,
    action: `report_${status}`,
    targetType: "report",
    targetId: reportId,
  });
  return NextResponse.json({ ok: true, report: updated });
}
