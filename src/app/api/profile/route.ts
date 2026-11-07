import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const ProfileUpdateSchema = z.object({
  fullName: z.string().optional(),
  heightCm: z.number().int().min(120).max(230).optional(),
  maritalStatus: z.string().optional(),
  languages: z.array(z.string()).optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  currentResidence: z.string().optional(),
  connectionToGB: z.string().optional(),
  education: z.string().optional(),
  institution: z.string().optional(),
  profession: z.string().optional(),
  employmentStatus: z.string().optional(),
  careerInfo: z.string().optional(),
  business: z.string().optional(),
  familyIntro: z.string().optional(),
  fatherOccupation: z.string().optional(),
  motherOccupation: z.string().optional(),
  siblingCount: z.number().int().min(0).max(20).optional(),
  familyDistrict: z.string().optional(),
  familyBackground: z.string().optional(),
  aboutMe: z.string().max(2000).optional(),
  qualitiesValued: z.string().max(1500).optional(),
  primaryPhoto: z.string().optional(),
  photos: z.array(z.string()).optional(),
  photoVisibility: z
    .enum(["PUBLIC_APPROVED", "APPROVED_ONLY", "AFTER_INTRODUCTION", "HIDDEN"])
    .optional(),
  profileVisibility: z
    .enum(["PUBLIC_APPROVED", "APPROVED_ONLY", "AFTER_INTRODUCTION", "HIDDEN"])
    .optional(),
  appearsInSearch: z.boolean().optional(),
  onlineStatusVisible: z.boolean().optional(),
  readReceiptsEnabled: z.boolean().optional(),
  familyInfoVisible: z.boolean().optional(),
});

function computeCompletion(p: Record<string, unknown>): number {
  const fields = [
    "fullName",
    "heightCm",
    "maritalStatus",
    "languages",
    "city",
    "education",
    "profession",
    "familyIntro",
    "aboutMe",
    "qualitiesValued",
    "primaryPhoto",
  ];
  const filled = fields.filter((f) => {
    const v = p[f];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    return String(v).trim() !== "";
  }).length;
  return Math.round((filled / fields.length) * 100);
}

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
    include: { preferences: true, verification: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  return NextResponse.json({
    profile: {
      ...profile,
      languages: profile.languages ? JSON.parse(profile.languages) : [],
      photos: profile.photos ? JSON.parse(profile.photos) : [],
    },
  });
}

export async function PATCH(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
      },
      { status: 422 }
    );
  }
  const d = parsed.data;
  const data: Record<string, unknown> = { ...d };
  if (d.languages) data.languages = JSON.stringify(d.languages);
  if (d.photos) data.photos = JSON.stringify(d.photos);

  const existing = await db.profile.findUnique({
    where: { userId: sess.userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  const merged = { ...existing, ...d };
  data.completionPercent = computeCompletion(merged);

  const updated = await db.profile.update({
    where: { userId: sess.userId },
    data,
  });
  await recordAudit({
    userId: sess.userId,
    action: "profile_updated",
    targetType: "profile",
    targetId: updated.id,
  });
  return NextResponse.json({ ok: true, profile: updated });
}
