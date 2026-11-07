import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";

const InviteSchema = z.object({
  name: z.string().min(2),
  relationship: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  permissions: z
    .object({
      canViewProfile: z.boolean().default(true),
      canSendMessage: z.boolean().default(false),
      canRequestIntroduction: z.boolean().default(false),
    })
    .optional(),
});

export async function GET() {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
    include: { familyReps: true },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  return NextResponse.json({ familyReps: profile.familyReps });
}

export async function POST(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = InviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid invite.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }
  const profile = await db.profile.findUnique({
    where: { userId: sess.userId },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }
  // Limit to 3 family reps
  const count = await db.familyRep.count({
    where: { profileId: profile.id, status: { not: "revoked" } },
  });
  if (count >= 3) {
    return NextResponse.json(
      { error: "You can authorize up to 3 active family representatives." },
      { status: 422 }
    );
  }
  const rep = await db.familyRep.create({
    data: {
      profileId: profile.id,
      name: parsed.data.name,
      relationship: parsed.data.relationship,
      email: parsed.data.email,
      phone: parsed.data.phone,
      permissions: parsed.data.permissions
        ? JSON.stringify(parsed.data.permissions)
        : JSON.stringify({
            canViewProfile: true,
            canSendMessage: false,
            canRequestIntroduction: false,
          }),
      status: "invited",
    },
  });
  await recordAudit({
    userId: sess.userId,
    action: "family_rep_invited",
    targetType: "family_rep",
    targetId: rep.id,
  });
  return NextResponse.json({ ok: true, familyRepId: rep.id });
}
