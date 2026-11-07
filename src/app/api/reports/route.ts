import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const ReportSchema = z.object({
  subjectUserId: z.string().min(1),
  reason: z.string().min(2),
  details: z.string().max(2000).optional(),
});

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const reports = await db.report.findMany({
    where: { reporterId: sess.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid report.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }
  if (parsed.data.subjectUserId === sess.userId) {
    return NextResponse.json(
      { error: "You cannot report yourself." },
      { status: 422 }
    );
  }
  const report = await db.report.create({
    data: {
      reporterId: sess.userId,
      subjectId: parsed.data.subjectUserId,
      reason: parsed.data.reason,
      details: parsed.data.details,
      status: "open",
    },
  });
  await recordAudit({
    userId: sess.userId,
    action: "report_filed",
    targetType: "report",
    targetId: report.id,
  });
  return NextResponse.json({ ok: true, reportId: report.id });
}
