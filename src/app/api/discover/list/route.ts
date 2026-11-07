import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  DEMO_PROFILES,
  VERIFICATION_BADGES,
} from "@/lib/garminas";
import { computeCompatibility, isMutualMatch } from "@/lib/matchmaking";

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
  mutualFactors?: { label: string; seekerSide: boolean; candidateSide: boolean }[];
  isMutualMatch: boolean;
  badges: string[];
  isDemo: boolean;
}

/**
 * Discover endpoint — MUTUAL MATCHING ONLY.
 *
 * A profile is only visible to a member if BOTH sides' declared preferences
 * are satisfied by the other's attributes:
 *   1. The viewer's preferences match the candidate's profile (seeker → candidate)
 *   2. The candidate's preferences match the viewer's profile (candidate → seeker)
 *
 * If either side hasn't set preferences yet, they are treated as "open to all"
 * (no constraint blocks the match).
 *
 * If no profiles match the viewer's mutual requirements, an empty list is
 * returned with a helpful message — NOT filled with non-matching profiles.
 * Demo profiles are only shown if they ALSO pass the mutual match check,
 * and are clearly labelled as DEMO.
 */
export async function GET(req: NextRequest) {
  const sess = await getCurrentUser();
  if (!sess) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!sess.profileApproved) {
    return NextResponse.json({
      matches: [],
      note: "Your profile must be approved before you can discover other members. Complete verification to unlock matchmaking.",
      profileNotApproved: true,
    });
  }

  const url = new URL(req.url);
  const ageMin = url.searchParams.get("ageMin");
  const ageMax = url.searchParams.get("ageMax");
  const district = url.searchParams.get("district");
  const education = url.searchParams.get("education");
  const profession = url.searchParams.get("profession");
  const maritalStatus = url.searchParams.get("maritalStatus");
  const query = url.searchParams.get("q");

  // ── The viewer's own profile + preferences + attributes ──────────────
  const myProfile = await db.profile.findUnique({
    where: { userId: sess.userId },
    include: { preferences: true },
  });
  if (!myProfile) {
    return NextResponse.json({
      matches: [],
      note: "Please complete your profile to discover compatible members.",
    });
  }

  const seekerAttrs = {
    age: myProfile.age ?? 0,
    city: myProfile.city ?? "",
    district: myProfile.district ?? "",
    education: myProfile.education ?? "",
    profession: myProfile.profession ?? "",
    maritalStatus: myProfile.maritalStatus ?? "",
  };
  const seekerPrefs = myProfile.preferences
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

  // Check if the viewer has set ANY preferences at all
  const hasSeekerPrefs =
    seekerPrefs.preferredAgeMin != null ||
    seekerPrefs.preferredAgeMax != null ||
    (seekerPrefs.preferredLocation && seekerPrefs.preferredLocation.length > 0) ||
    seekerPrefs.educationPrefs ||
    seekerPrefs.professionPrefs ||
    (seekerPrefs.maritalStatusPrefs && seekerPrefs.maritalStatusPrefs.length > 0);

  // ── Fetch all approved, visible profiles (excluding self + blocked) ───
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
      preferences: true,
      user: { select: { id: true } },
    },
  });

  // ── MUTUAL MATCH FILTERING ────────────────────────────────────────────
  // A profile is only shown if BOTH sides' declared preferences are satisfied.
  const realMatches: DiscoverMatch[] = [];

  for (const p of dbProfiles) {
    // Apply the viewer's manual search filters first (age, district, etc.)
    if (ageMin && (p.age ?? 0) < Number(ageMin)) continue;
    if (ageMax && (p.age ?? 0) > Number(ageMax)) continue;
    if (district && p.district !== district) continue;
    if (education && p.education !== education) continue;
    if (profession && !p.profession?.includes(profession)) continue;
    if (maritalStatus && p.maritalStatus !== maritalStatus) continue;
    if (query) {
      const q = query.toLowerCase();
      const hay = `${p.fullName ?? ""} ${p.city ?? ""} ${p.district ?? ""} ${p.profession ?? ""}`.toLowerCase();
      if (!hay.includes(q)) continue;
    }

    const candidateAttrs = {
      age: p.age ?? 0,
      city: p.city ?? "",
      district: p.district ?? "",
      education: p.education ?? "",
      profession: p.profession ?? "",
      maritalStatus: p.maritalStatus ?? "",
    };
    const candidatePrefs = p.preferences
      ? {
          preferredAgeMin: p.preferences.preferredAgeMin,
          preferredAgeMax: p.preferences.preferredAgeMax,
          preferredLocation: p.preferences.preferredLocation
            ? JSON.parse(p.preferences.preferredLocation)
            : null,
          educationPrefs: p.preferences.educationPrefs,
          professionPrefs: p.preferences.professionPrefs,
          maritalStatusPrefs: p.preferences.maritalStatusPrefs
            ? JSON.parse(p.preferences.maritalStatusPrefs)
            : null,
        }
      : {};

    // ── THE KEY CHECK: mutual matching ──
    // Only show this profile if BOTH sides' requirements match.
    const mutual = isMutualMatch(
      seekerPrefs,
      seekerAttrs,
      candidatePrefs,
      candidateAttrs
    );

    if (!mutual.isMutualMatch) {
      // This profile's requirements (or the viewer's) don't align.
      // Do NOT show it.
      continue;
    }

    // Compute the one-directional compatibility for display
    const c = computeCompatibility(seekerPrefs, candidateAttrs);
    const v = p.verification;
    const badges: string[] = [];
    if (v?.emailVerified) badges.push(VERIFICATION_BADGES[0].label);
    if (v?.phoneVerified) badges.push(VERIFICATION_BADGES[1].label);
    if (v?.identityVerified) badges.push(VERIFICATION_BADGES[2].label);
    if (v?.communityVerified) badges.push(VERIFICATION_BADGES[3].label);
    if (v?.profileApproved) badges.push(VERIFICATION_BADGES[4].label);

    realMatches.push({
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
      mutualFactors: mutual.mutualFactors,
      isMutualMatch: true,
      badges,
      isDemo: false,
    });
  }

  // Sort by compatibility score (highest first)
  realMatches.sort((a, b) => b.compatibility - a.compatibility);

  // ── Demo profiles: also subject to mutual matching ────────────────────
  // Demo profiles are only shown if they ALSO pass the mutual match check.
  // They are clearly labelled as DEMO so members know they're sample data.
  let demoMatches: DiscoverMatch[] = [];
  if (realMatches.length < 3) {
    demoMatches = DEMO_PROFILES.filter((p) => p.userId !== sess.userId)
      .filter((p) => {
        // Apply manual search filters
        if (ageMin && p.age < Number(ageMin)) return false;
        if (ageMax && p.age > Number(ageMax)) return false;
        if (district && p.district !== district) return false;
        if (education && p.education !== education) return false;
        if (profession && !p.profession.includes(profession)) return false;
        if (maritalStatus && p.maritalStatus !== maritalStatus) return false;
        if (query) {
          const q = query.toLowerCase();
          const hay = `${p.fullName} ${p.city} ${p.district} ${p.profession}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .filter((p) => {
        // ── Apply mutual match check to demo profiles too ──
        const candidateAttrs = {
          age: p.age,
          city: p.city,
          district: p.district,
          education: p.education,
          profession: p.profession,
          maritalStatus: p.maritalStatus,
        };
        const candidatePrefs = {
          preferredAgeMin: p.preferences.preferredAgeMin,
          preferredAgeMax: p.preferences.preferredAgeMax,
          preferredLocation: p.preferences.preferredLocation,
          educationPrefs: p.preferences.educationPrefs,
          professionPrefs: p.preferences.professionPrefs,
          maritalStatusPrefs: ["Never married"], // demo default
        };
        const mutual = isMutualMatch(
          seekerPrefs,
          seekerAttrs,
          candidatePrefs,
          candidateAttrs
        );
        return mutual.isMutualMatch;
      })
      .map((p) => {
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
          isMutualMatch: true,
          badges: p.badges.map(
            (b) => VERIFICATION_BADGES.find((vb) => vb.key === b)?.label ?? b
          ),
          isDemo: true,
        };
      });
    demoMatches.sort((a, b) => b.compatibility - a.compatibility);
  }

  // ── Build the response ────────────────────────────────────────────────
  const allMatches = [...realMatches, ...demoMatches];

  let note: string;
  if (!hasSeekerPrefs) {
    note =
      "You haven't set your marriage preferences yet. Visit Edit Profile → Marriage Preferences to receive matched recommendations. Until then, only profiles that are open to all members are shown.";
  } else if (allMatches.length === 0) {
    note =
      "No profiles currently match your mutual requirements. Profiles are only shown when both your preferences and theirs align. Try widening your preferences, or check back as new verified members join.";
  } else {
    note =
      "Profiles shown only when both your preferences and theirs mutually align. Profiles marked DEMO are clearly-labelled demonstration data.";
  }

  return NextResponse.json({
    matches: allMatches,
    hasSeekerPrefs,
    note,
  });
}
