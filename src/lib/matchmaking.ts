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
