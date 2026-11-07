import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { DEMO_PROFILES } from "@/lib/garminas";

// One-shot seeding of:
//   - a clearly-labelled demo admin
//   - a clearly-labelled demo approved member (the "logged-in" test user)
//   - 6 real DB-backed demo profiles so proposals/messages work end-to-end.
// In production this endpoint MUST be removed or guarded behind first-run setup.
export async function POST() {
  const existingAdmin = await db.user.findUnique({
    where: { email: "admin@garminas.demo" },
  });
  const existingMember = await db.user.findUnique({
    where: { email: "member@garminas.demo" },
  });

  const results: string[] = [];

  if (!existingAdmin) {
    const { hash, salt } = await hashPassword("GarMinas@Admin2026");
    const admin = await db.user.create({
      data: {
        email: "admin@garminas.demo",
        phone: "+92000000000",
        passwordHash: hash,
        passwordSalt: salt,
        emailVerified: true,
        phoneVerified: true,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        isProfileApproved: true,
      },
    });
    await db.adminRole.create({
      data: {
        userId: admin.id,
        canManageMembers: true,
        canVerifyIdentity: true,
        canVerifyCommunity: true,
        canModerate: true,
        canViewAnalytics: true,
        canManageAdmins: true,
      },
    });
    results.push("Created demo admin: admin@garminas.demo / GarMinas@Admin2026");
  } else {
    results.push("Demo admin already exists.");
  }

  if (!existingMember) {
    const { hash, salt } = await hashPassword("GarMinas@Member2026");
    const member = await db.user.create({
      data: {
        email: "member@garminas.demo",
        phone: "+923001234567",
        passwordHash: hash,
        passwordSalt: salt,
        emailVerified: true,
        phoneVerified: true,
        role: "MEMBER",
        status: "ACTIVE",
        isProfileApproved: true,
      },
    });
    const profile = await db.profile.create({
      data: {
        userId: member.id,
        fullName: "Demo Member",
        age: 28,
        gender: "Female",
        city: "Karachi",
        district: "Hunza",
        connectionToGB: "Family from Hunza",
        maritalStatus: "Never married",
        education: "Master's",
        profession: "Education",
        heightCm: 165,
        languages: JSON.stringify(["Urdu", "English", "Burushaski"]),
        aboutMe:
          "Demo member account for testing the GarMinas platform. This is not a real person.",
        qualitiesValued: "Honesty, kindness, family orientation.",
        completionPercent: 90,
        photoVisibility: "APPROVED_ONLY",
        profileVisibility: "APPROVED_ONLY",
        appearsInSearch: true,
      },
    });
    await db.preferences.create({
      data: {
        profileId: profile.id,
        preferredAgeMin: 28,
        preferredAgeMax: 34,
        preferredLocation: JSON.stringify(["Karachi", "Islamabad", "Hunza"]),
        educationPrefs: "Bachelor's or higher",
        professionPrefs: "Any",
        maritalStatusPrefs: JSON.stringify(["Never married"]),
      },
    });
    await db.verificationRecord.create({
      data: {
        profileId: profile.id,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        communityVerified: true,
        profileApproved: true,
        profileApprovedAt: new Date(),
        status: "APPROVED",
      },
    });
    results.push(
      "Created demo approved member: member@garminas.demo / GarMinas@Member2026"
    );
  } else {
    results.push("Demo member already exists.");
  }

  // Seed real DB profiles for the 6 demo candidates so proposals/messages work.
  // These are clearly labelled via their email pattern (candidate.demo@garminas.demo).
  for (const dp of DEMO_PROFILES) {
    const existing = await db.user.findUnique({
      where: { email: `candidate+${dp.userId}@garminas.demo` },
    });
    if (existing) {
      results.push(`Demo candidate ${dp.fullName} already exists.`);
      continue;
    }
    const { hash, salt } = await hashPassword(`DemoCandidate-${dp.userId}`);
    const u = await db.user.create({
      data: {
        email: `candidate+${dp.userId}@garminas.demo`,
        phone: `+92300${dp.userId.replace(/[^0-9]/g, "").slice(-7).padStart(7, "0")}`,
        passwordHash: hash,
        passwordSalt: salt,
        emailVerified: true,
        phoneVerified: true,
        role: "MEMBER",
        status: "ACTIVE",
        isProfileApproved: true,
      },
    });
    const prof = await db.profile.create({
      data: {
        userId: u.id,
        fullName: dp.fullName,
        age: dp.age,
        gender: dp.gender,
        heightCm: dp.heightCm,
        city: dp.city,
        district: dp.district,
        connectionToGB: dp.connectionToGB,
        maritalStatus: dp.maritalStatus,
        education: dp.education,
        profession: dp.profession,
        languages: JSON.stringify(dp.languages),
        aboutMe: dp.aboutMe,
        qualitiesValued: dp.qualitiesValued,
        familyIntro: dp.familyIntro,
        completionPercent: 92,
        photoVisibility: "APPROVED_ONLY",
        profileVisibility: "APPROVED_ONLY",
        appearsInSearch: true,
      },
    });
    await db.preferences.create({
      data: {
        profileId: prof.id,
        preferredAgeMin: dp.preferences.preferredAgeMin,
        preferredAgeMax: dp.preferences.preferredAgeMax,
        preferredLocation: JSON.stringify(dp.preferences.preferredLocation),
        educationPrefs: dp.preferences.educationPrefs,
        professionPrefs: dp.preferences.professionPrefs,
        maritalStatusPrefs: JSON.stringify(["Never married"]),
      },
    });
    await db.verificationRecord.create({
      data: {
        profileId: prof.id,
        emailVerified: true,
        phoneVerified: true,
        identityVerified: true,
        communityVerified: true,
        profileApproved: true,
        profileApprovedAt: new Date(),
        status: "APPROVED",
      },
    });
    results.push(`Created demo candidate: ${dp.fullName}`);
  }

  return NextResponse.json({ ok: true, results });
}
