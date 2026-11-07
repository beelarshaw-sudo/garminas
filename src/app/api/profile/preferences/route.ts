import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const PrefSchema = z.object({
  preferredAgeMin: z.number().int().min(18).max(99).optional(),
  preferredAgeMax: z.number().int().min(18).max(99).optional(),
  preferredLocation: z.array(z.string()).optional(),
  educationPrefs: z.string().optional(),
  professionPrefs: z.string().optional(),
  maritalStatusPrefs: z.array(z.string()).optional(),
  lifestyleExpectations: z.string().optional(),
  familyExpectations: z.string().optional(),
  personalValues: z.string().optional(),
  priorities: z
    .array(z.object({ factor: z.string(), weight: z.number().min(1).max(10) }))
    .optional(),
});

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
    include: { preferences: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  if (!profile.preferences) {
    return NextResponse.json({ preferences: null });
  }
  const p = profile.preferences;
  return NextResponse.json({
    preferences: {
      ...p,
      preferredLocation: p.preferredLocation ? JSON.parse(p.preferredLocation) : [],
      maritalStatusPrefs: p.maritalStatusPrefs
        ? JSON.parse(p.maritalStatusPrefs)
        : [],
      priorities: p.priorities ? JSON.parse(p.priorities) : [],
    },
  });
}

export async function PATCH(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = PrefSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }
  const d = parsed.data;
  const data: Record<string, unknown> = { ...d };
  if (d.preferredLocation) data.preferredLocation = JSON.stringify(d.preferredLocation);
  if (d.maritalStatusPrefs)
    data.maritalStatusPrefs = JSON.stringify(d.maritalStatusPrefs);
  if (d.priorities) data.priorities = JSON.stringify(d.priorities);

  const profile = await db.profile.findUnique({ where: { userId: sess.userId } });
  if (!profile)
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const updated = await db.preferences.upsert({
    where: { profileId: profile.id },
    create: { profileId: profile.id, ...data },
    update: data,
  });
  await recordAudit({
    userId: sess.userId,
    action: "preferences_updated",
    targetType: "preferences",
    targetId: updated.id,
  });
  return NextResponse.json({ ok: true });
}
