import { DemoProfile, DEMO_PROFILES } from "./garminas";

export interface CompatibilityResult {
  score: number; // 0-100
  factors: { label: string; matched: boolean }[];
}

/**
 * Transparent rules-based compatibility engine.
 * It compares the seeker's declared preferences against another profile's
 * declared attributes. It NEVER infers personality, suitability or worth,
 * and NEVER uses protected characteristics (religion inferred from name,
 * socioeconomic status, disability, appearance) to reject or hide a member.
 *
 * Designed so an advanced recommendation model can be swapped in later
 * behind the same interface.
 */
export function computeCompatibility(
  seekerPrefs: {
    preferredAgeMin?: number | null;
    preferredAgeMax?: number | null;
    preferredLocation?: string[] | null;
    educationPrefs?: string | null;
    professionPrefs?: string | null;
    maritalStatusPrefs?: string[] | null;
  },
  candidate: {
    age: number;
    city: string;
    district: string;
    education: string;
    profession: string;
    maritalStatus: string;
  }
): CompatibilityResult {
  const factors: { label: string; matched: boolean }[] = [];
  let matched = 0;
  let total = 0;

  // Age
  total++;
  const inAge =
    seekerPrefs.preferredAgeMin != null &&
    seekerPrefs.preferredAgeMax != null &&
    candidate.age >= seekerPrefs.preferredAgeMin &&
    candidate.age <= seekerPrefs.preferredAgeMax;
  factors.push({ label: "Age range", matched: inAge });
  if (inAge) matched++;

  // Location
  if (seekerPrefs.preferredLocation && seekerPrefs.preferredLocation.length > 0) {
    total++;
    const locMatch =
      seekerPrefs.preferredLocation.some(
        (l) =>
          candidate.city.toLowerCase().includes(l.toLowerCase()) ||
          candidate.district.toLowerCase().includes(l.toLowerCase())
      );
    factors.push({ label: "Preferred location", matched: locMatch });
    if (locMatch) matched++;
  }

  // Education — soft match (Bachelor's >= Bachelor's, etc.)
  if (seekerPrefs.educationPrefs) {
    total++;
    const eduMatch = educationSatisfies(candidate.education, seekerPrefs.educationPrefs);
    factors.push({ label: "Education preference", matched: eduMatch });
    if (eduMatch) matched++;
  }

  // Profession — soft match
  if (seekerPrefs.professionPrefs && seekerPrefs.professionPrefs.toLowerCase() !== "any") {
    total++;
    const profMatch = candidate.profession
      .toLowerCase()
      .includes(seekerPrefs.professionPrefs.toLowerCase().split(" ")[0]);
    factors.push({ label: "Profession preference", matched: profMatch });
    if (profMatch) matched++;
  }

  // Marital status
  if (
    seekerPrefs.maritalStatusPrefs &&
    seekerPrefs.maritalStatusPrefs.length > 0
  ) {
    total++;
    const msMatch = seekerPrefs.maritalStatusPrefs.includes(candidate.maritalStatus);
    factors.push({ label: "Marital status preference", matched: msMatch });
    if (msMatch) matched++;
  }

  const score = total === 0 ? 0 : Math.round((matched / total) * 100);
  return { score, factors };
}

const EDU_ORDER = [
  "Secondary",
  "Higher Secondary",
  "Diploma",
  "Bachelor's",
  "Master's",
  "MPhil / MS",
  "Doctorate",
  "Professional Qualification",
];

function educationSatisfies(candidate: string, pref: string): boolean {
  if (pref.toLowerCase().includes("any")) return true;
  // parse "Bachelor's or higher"
  const m = pref.match(/^(.*?)\s+or\s+higher$/i);
  const base = m ? m[1].trim() : pref.trim();
  const ci = EDU_ORDER.indexOf(candidate);
  const bi = EDU_ORDER.indexOf(base);
  if (ci < 0 || bi < 0) return candidate === base;
  return ci >= bi;
}

/**
 * MUTUAL MATCH CHECK
 *
 * A profile is only visible to a member if BOTH sides' declared preferences
 * are satisfied by the other's attributes. This implements bidirectional
 * (mutual) matching — not just "do I like them" but "do we both match."
 *
 * If a side hasn't declared any preferences yet, they are treated as
 * "open to all" (no constraint) rather than blocking all matches.
 */
export interface MutualMatchResult {
  isMutualMatch: boolean;
  seekerToCandidate: CompatibilityResult; // "Do my prefs match their profile?"
  candidateToSeeker: CompatibilityResult; // "Do their prefs match my profile?"
  mutualFactors: { label: string; seekerSide: boolean; candidateSide: boolean }[];
}

export function isMutualMatch(
  seekerPrefs: {
    preferredAgeMin?: number | null;
    preferredAgeMax?: number | null;
    preferredLocation?: string[] | null;
    educationPrefs?: string | null;
    professionPrefs?: string | null;
    maritalStatusPrefs?: string[] | null;
  },
  seekerAttrs: {
    age: number;
    city: string;
    district: string;
    education: string;
    profession: string;
    maritalStatus: string;
  },
  candidatePrefs: {
    preferredAgeMin?: number | null;
    preferredAgeMax?: number | null;
    preferredLocation?: string[] | null;
    educationPrefs?: string | null;
    professionPrefs?: string | null;
    maritalStatusPrefs?: string[] | null;
  },
  candidateAttrs: {
    age: number;
    city: string;
    district: string;
    education: string;
    profession: string;
    maritalStatus: string;
  }
): MutualMatchResult {
  // Direction 1: seeker → candidate (do my prefs match their profile?)
  const s2c = computeCompatibility(seekerPrefs, candidateAttrs);
  // Direction 2: candidate → seeker (do their prefs match my profile?)
  const c2s = computeCompatibility(candidatePrefs, seekerAttrs);

  // Build mutual factors showing both sides
  const mutualFactors: {
    label: string;
    seekerSide: boolean;
    candidateSide: boolean;
  }[] = [];

  // Helper: look up a factor result safely
  const factorMatched = (
    result: CompatibilityResult,
    label: string
  ): boolean => {
    const f = result.factors.find((x) => x.label === label);
    return f ? f.matched : true; // if factor wasn't computed (no pref set), treat as pass
  };

  // Age — both sides must match (if they've set a preference)
  const seekerAgeSet =
    seekerPrefs.preferredAgeMin != null && seekerPrefs.preferredAgeMax != null;
  const candidateAgeSet =
    candidatePrefs.preferredAgeMin != null && candidatePrefs.preferredAgeMax != null;
  if (seekerAgeSet || candidateAgeSet) {
    const sSide = !seekerAgeSet || factorMatched(s2c, "Age range");
    const cSide = !candidateAgeSet || factorMatched(c2s, "Age range");
    mutualFactors.push({ label: "Age range", seekerSide: sSide, candidateSide: cSide });
  }

  // Location
  const seekerLocSet =
    seekerPrefs.preferredLocation && seekerPrefs.preferredLocation.length > 0;
  const candidateLocSet =
    candidatePrefs.preferredLocation && candidatePrefs.preferredLocation.length > 0;
  if (seekerLocSet || candidateLocSet) {
    const sSide = !seekerLocSet || factorMatched(s2c, "Preferred location");
    const cSide = !candidateLocSet || factorMatched(c2s, "Preferred location");
    mutualFactors.push({ label: "Location", seekerSide: sSide, candidateSide: cSide });
  }

  // Education
  if (seekerPrefs.educationPrefs || candidatePrefs.educationPrefs) {
    const sSide = !seekerPrefs.educationPrefs || factorMatched(s2c, "Education preference");
    const cSide = !candidatePrefs.educationPrefs || factorMatched(c2s, "Education preference");
    mutualFactors.push({ label: "Education", seekerSide: sSide, candidateSide: cSide });
  }

  // Profession
  const seekerProfSet =
    seekerPrefs.professionPrefs &&
    seekerPrefs.professionPrefs.toLowerCase() !== "any";
  const candidateProfSet =
    candidatePrefs.professionPrefs &&
    candidatePrefs.professionPrefs.toLowerCase() !== "any";
  if (seekerProfSet || candidateProfSet) {
    const sSide = !seekerProfSet || factorMatched(s2c, "Profession preference");
    const cSide = !candidateProfSet || factorMatched(c2s, "Profession preference");
    mutualFactors.push({ label: "Profession", seekerSide: sSide, candidateSide: cSide });
  }

  // Marital status
  const seekerMsSet =
    seekerPrefs.maritalStatusPrefs && seekerPrefs.maritalStatusPrefs.length > 0;
  const candidateMsSet =
    candidatePrefs.maritalStatusPrefs && candidatePrefs.maritalStatusPrefs.length > 0;
  if (seekerMsSet || candidateMsSet) {
    const sSide = !seekerMsSet || factorMatched(s2c, "Marital status preference");
    const cSide = !candidateMsSet || factorMatched(c2s, "Marital status preference");
    mutualFactors.push({ label: "Marital status", seekerSide: sSide, candidateSide: cSide });
  }

  // A mutual match requires that all DECLARED preferences on both sides are satisfied.
  // If someone hasn't set a preference, it doesn't block the match.
  const isMutualMatch = mutualFactors.every(
    (f) => f.seekerSide && f.candidateSide
  );

  return {
    isMutualMatch,
    seekerToCandidate: s2c,
    candidateToSeeker: c2s,
    mutualFactors,
  };
}

export interface DiscoverFilters {
  ageMin?: number;
  ageMax?: number;
  district?: string;
  education?: string;
  profession?: string;
  maritalStatus?: string;
  query?: string;
}

export function filterAndRankDemo(
  seekerPrefs: CompatibilityResult["score"] extends never ? never : {
    preferredAgeMin?: number | null;
    preferredAgeMax?: number | null;
    preferredLocation?: string[] | null;
    educationPrefs?: string | null;
    professionPrefs?: string | null;
    maritalStatusPrefs?: string[] | null;
  },
  filters: DiscoverFilters,
  excludeUserIds: string[] = []
): Array<DemoProfile & { compatibility: number; factors: { label: string; matched: boolean }[] }> {
  const list = DEMO_PROFILES.filter((p) => !excludeUserIds.includes(p.userId));
  const filtered = list.filter((p) => {
    if (filters.ageMin != null && p.age < filters.ageMin) return false;
    if (filters.ageMax != null && p.age > filters.ageMax) return false;
    if (filters.district && p.district !== filters.district) return false;
    if (filters.education && p.education !== filters.education) return false;
    if (filters.profession && !p.profession.includes(filters.profession)) return false;
    if (filters.maritalStatus && p.maritalStatus !== filters.maritalStatus) return false;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const haystack = `${p.fullName} ${p.city} ${p.district} ${p.profession} ${p.education}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  const withCompat = filtered.map((p) => {
    const c = computeCompatibility(seekerPrefs, p);
    return { ...p, compatibility: c.score, factors: c.factors };
  });
  withCompat.sort((a, b) => b.compatibility - a.compatibility);
  return withCompat;
}
