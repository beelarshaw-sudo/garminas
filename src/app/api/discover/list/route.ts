import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  DEMO_PROFILES,
  VERIFICATION_BADGES,
} from "@/lib/garminas";
import { computeCompatibility } from "@/lib/matchmaking";

interface DiscoverMatch {
  profileId: string;
  userId: string;
  fullName: string;
  age: number;
  gender: string;
  city: string;
  district: string;
  profession: string;
  education: string;
  maritalStatus: string;
  aboutMe?: string;
  compatibility: number;
  compatibilityFactors: { label: string; matched: boolean }[];
  badges: string[];
  isDemo: boolean;
}

// Discover returns REAL approved member profiles from the DB.
// If the DB has fewer than 4 approved members, it supplements with
// clearly-labelled DEMO profiles so the UX is always visible.
export async function GET(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  const url = new URL(req.url);
  const ageMin = url.searchParams.get("ageMin");
  const ageMax = url.searchParams.get("ageMax");
  const district = url.searchParams.get("district");
  const education = url.searchParams.get("education");
  const profession = url.searchParams.get("profession");
  const maritalStatus = url.searchParams.get("maritalStatus");
  const query = url.searchParams.get("q");

  const myProfile = await db.profile.findUnique({
    where: { userId: sess.userId },
    include: { preferences: true },
  });
  const seekerPrefs = myProfile?.preferences
    ? {
        preferredAgeMin: myProfile.preferences.preferredAgeMin,
        preferredAgeMax: myProfile.preferences.preferredAgeMax,
        preferredLocation: myProfile.preferences.preferredLocation
          ? JSON.parse(myProfile.preferences.preferredLocation)
          : null,
        educationPrefs: myProfile.preferences.educationPrefs,
        professionPrefs: myProfile.preferences.professionPrefs,
        maritalStatusPrefs: myProfile.preferences.maritalStatusPrefs
          ? JSON.parse(myProfile.preferences.maritalStatusPrefs)
          : null,
      }
    : {};

  // Fetch all approved profiles EXCEPT the current user + blocked members.
  const blocks = await db.block.findMany({
    where: { blockerId: sess.userId },
    select: { blockedId: true },
  });
  const blockedUserIds = blocks.map((b) => b.blockedId);

  const dbProfiles = await db.profile.findMany({
    where: {
      userId: { not: sess.userId, notIn: blockedUserIds },
      user: {
        isProfileApproved: true,
        status: "ACTIVE",
        isInactivityPaused: false,
        isHidden: false,
      },
      appearsInSearch: true,
    },
    include: {
      verification: true,
      user: { select: { id: true } },
    },
  });

  const realMatches: DiscoverMatch[] = dbProfiles
    .filter((p) => {
      if (ageMin && (p.age ?? 0) < Number(ageMin)) return false;
      if (ageMax && (p.age ?? 0) > Number(ageMax)) return false;
      if (district && p.district !== district) return false;
      if (education && p.education !== education) return false;
      if (profession && !p.profession?.includes(profession)) return false;
      if (maritalStatus && p.maritalStatus !== maritalStatus) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay = `${p.fullName ?? ""} ${p.city ?? ""} ${p.district ?? ""} ${p.profession ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .map((p) => {
      const c = computeCompatibility(seekerPrefs, {
        age: p.age ?? 0,
        city: p.city ?? "",
        district: p.district ?? "",
        education: p.education ?? "",
        profession: p.profession ?? "",
        maritalStatus: p.maritalStatus ?? "",
      });
      const v = p.verification;
      const badges: string[] = [];
      if (v?.emailVerified) badges.push(VERIFICATION_BADGES[0].label);
      if (v?.phoneVerified) badges.push(VERIFICATION_BADGES[1].label);
      if (v?.identityVerified) badges.push(VERIFICATION_BADGES[2].label);
      if (v?.communityVerified) badges.push(VERIFICATION_BADGES[3].label);
      if (v?.profileApproved) badges.push(VERIFICATION_BADGES[4].label);
      return {
        profileId: p.id,
        userId: p.userId,
        fullName: p.fullName ?? "Member",
        age: p.age ?? 0,
        gender: p.gender ?? "",
        city: p.city ?? "",
        district: p.district ?? "",
        profession: p.profession ?? "",
        education: p.education ?? "",
        maritalStatus: p.maritalStatus ?? "",
        aboutMe: p.aboutMe ?? undefined,
        compatibility: c.score,
        compatibilityFactors: c.factors,
        badges,
        isDemo: false,
      };
    });

  realMatches.sort((a, b) => b.compatibility - a.compatibility);

  // If we have very few real matches, supplement with clearly-labelled DEMO profiles.
  let demoMatches: DiscoverMatch[] = [];
  if (realMatches.length < 4) {
    let demoFiltered = DEMO_PROFILES.filter((p) => p.userId !== sess.userId);
    if (ageMin) demoFiltered = demoFiltered.filter((p) => p.age >= Number(ageMin));
    if (ageMax) demoFiltered = demoFiltered.filter((p) => p.age <= Number(ageMax));
    if (district) demoFiltered = demoFiltered.filter((p) => p.district === district);
    if (education) demoFiltered = demoFiltered.filter((p) => p.education === education);
    if (profession)
      demoFiltered = demoFiltered.filter((p) => p.profession.includes(profession));
    if (maritalStatus)
      demoFiltered = demoFiltered.filter((p) => p.maritalStatus === maritalStatus);
    if (query) {
      const q = query.toLowerCase();
      demoFiltered = demoFiltered.filter((p) =>
        `${p.fullName} ${p.city} ${p.district} ${p.profession}`
          .toLowerCase()
          .includes(q)
      );
    }
    demoMatches = demoFiltered.map((p) => {
      const c = computeCompatibility(seekerPrefs, p);
      return {
        profileId: p.id,
        userId: p.userId,
        fullName: p.fullName,
        age: p.age,
        gender: p.gender,
        city: p.city,
        district: p.district,
        profession: p.profession,
        education: p.education,
        maritalStatus: p.maritalStatus,
        aboutMe: p.aboutMe,
        compatibility: c.score,
        compatibilityFactors: c.factors,
        badges: p.badges.map(
          (b) => VERIFICATION_BADGES.find((vb) => vb.key === b)?.label ?? b
        ),
        isDemo: true,
      };
    });
    demoMatches.sort((a, b) => b.compatibility - a.compatibility);
  }

  return NextResponse.json({
    matches: [...realMatches, ...demoMatches],
    note:
      "Profiles marked DEMO are clearly-labelled demonstration data. Real member profiles are verified, approved, and shown according to each member's visibility permissions.",
  });
}
