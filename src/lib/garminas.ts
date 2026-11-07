// GarMinas shared types and constants

export const GARMINAS_DISTRICTS = [
  "Gilgit",
  "Hunza",
  "Nagar",
  "Ghizer",
  "Gupis-Yasin",
  "Diamer",
  "Astore",
  "Skardu (adjacent)",
  "Other",
] as const;

export const GARMINAS_PALETTE = {
  gold: "#D6B77A",
  goldSoft: "#E8D9B5",
  ivory: "#FAF7F0",
  navy: "#111827",
  rose: "#C88F91",
  beige: "#E9DFD0",
  white: "#FFFFFF",
} as const;

export const MARITAL_STATUSES = [
  "Never married",
  "Divorced",
  "Widowed",
  "Annulled",
] as const;

export const EDUCATION_LEVELS = [
  "Secondary",
  "Higher Secondary",
  "Diploma",
  "Bachelor's",
  "Master's",
  "MPhil / MS",
  "Doctorate",
  "Professional Qualification",
  "Other",
] as const;

export const PROFESSION_CATEGORIES = [
  "Student",
  "Government / Public Sector",
  "Private Sector",
  "Business / Self-employed",
  "Healthcare",
  "Education",
  "Engineering / Technology",
  "Finance / Banking",
  "Agriculture",
  "Tourism / Hospitality",
  "Social Work / NGO",
  "Homemaker",
  "Retired",
  "Other",
] as const;

export const VERIFICATION_BADGES = [
  {
    key: "email",
    label: "Email Verified",
    description: "The member has confirmed ownership of their email address.",
  },
  {
    key: "phone",
    label: "Phone Verified",
    description: "The member has confirmed their mobile number via OTP.",
  },
  {
    key: "identity",
    label: "Identity Verified",
    description:
      "An authorized reviewer has reviewed identity documentation submitted by the member.",
  },
  {
    key: "community",
    label: "Community Verified",
    description:
      "An authorized reviewer has discreetly verified the member's Ismaili community eligibility through approved references. Religious identity is never inferred from a name, location or photograph.",
  },
  {
    key: "profileApproved",
    label: "Profile Approved",
    description:
      "The member's profile and photographs have passed moderation review by GarMinas administrators.",
  },
] as const;

export const PROPOSAL_STATUSES = [
  "SENT",
  "DELIVERED",
  "VIEWED",
  "ACCEPTED",
  "DECLINED",
  "INTRODUCTION_REQUESTED",
  "FAMILY_DISCUSSION",
  "CLOSED",
] as const;

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  SENT: "Sent",
  DELIVERED: "Delivered",
  VIEWED: "Viewed",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  INTRODUCTION_REQUESTED: "Introduction Requested",
  FAMILY_DISCUSSION: "Family Discussion",
  CLOSED: "Closed",
};

export const REPORT_REASONS = [
  "Fake profile",
  "Impersonation",
  "Harassment",
  "Inappropriate behaviour",
  "Fraud or financial request",
  "Misrepresentation",
  "Suspicious account",
  "Unwanted contact",
  "Other",
] as const;

export type ViewKey =
  | "home"
  | "about"
  | "register"
  | "login"
  | "profile-create"
  | "profile-edit"
  | "dashboard"
  | "discover"
  | "profile-detail"
  | "proposals"
  | "messages"
  | "family"
  | "verify"
  | "privacy"
  | "subscription"
  | "notifications"
  | "safety"
  | "success-stories"
  | "help"
  | "admin"
  | "legal-terms"
  | "legal-privacy"
  | "legal-community"
  | "legal-matrimonial"
  | "legal-conduct"
  | "legal-verification"
  | "legal-safety"
  | "legal-cookie"
  | "legal-retention"
  | "legal-deletion"
  | "legal-reporting"
  | "guidance";

export interface MatchCardData {
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
  primaryPhoto?: string;
  compatibility: number; // 0-100
  compatibilityFactors: { label: string; matched: boolean }[];
  badges: string[];
}

export interface DemoProfile {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  gender: string;
  heightCm: number;
  city: string;
  district: string;
  profession: string;
  education: string;
  maritalStatus: string;
  languages: string[];
  aboutMe: string;
  qualitiesValued: string;
  primaryPhoto?: string;
  connectionToGB: string;
  badges: string[];
  preferences: {
    preferredAgeMin: number;
    preferredAgeMax: number;
    preferredLocation: string[];
    educationPrefs: string;
    professionPrefs: string;
  };
  familyIntro?: string;
}

// All demo profiles are clearly labelled DEMO in the UI and DB.
export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "demo-profile-1",
    userId: "demo-user-1",
    fullName: "Aaliyah Karim",
    age: 26,
    gender: "Female",
    heightCm: 165,
    city: "Karachi",
    district: "Hunza",
    profession: "Healthcare",
    education: "Master's",
    maritalStatus: "Never married",
    languages: ["Urdu", "English", "Burushaski"],
    aboutMe:
      "I am a public health researcher who grew up between Hunza and Karachi. I value family, faith, and quiet, intentional living. I am seeking a marriage built on mutual respect and shared purpose.",
    qualitiesValued:
      "Honesty, kindness, emotional maturity, and a genuine interest in building a family together.",
    connectionToGB: "Born in Karimabad, Hunza",
    badges: ["email", "phone", "identity", "community", "profileApproved"],
    preferences: {
      preferredAgeMin: 27,
      preferredAgeMax: 33,
      preferredLocation: ["Karachi", "Hunza", "Islamabad"],
      educationPrefs: "Bachelor's or higher",
      professionPrefs: "Any professional field",
    },
    familyIntro:
      "We are a small, close-knit family rooted in Hunza. My father is a retired education officer and my mother is a homemaker.",
  },
  {
    id: "demo-profile-2",
    userId: "demo-user-2",
    fullName: "Daniyal Ali",
    age: 30,
    gender: "Male",
    heightCm: 178,
    city: "Islamabad",
    district: "Gilgit",
    profession: "Engineering / Technology",
    education: "Master's",
    maritalStatus: "Never married",
    languages: ["Urdu", "English", "Shina"],
    aboutMe:
      "Software engineer working in Islamabad, originally from Gilgit. I enjoy hiking, reading, and spending time with my family in the north during summers.",
    qualitiesValued:
      "Compassion, intellectual curiosity, family orientation, and a sense of adventure balanced with responsibility.",
    connectionToGB: "Family from Gilgit",
    badges: ["email", "phone", "identity", "community", "profileApproved"],
    preferences: {
      preferredAgeMin: 24,
      preferredAgeMax: 30,
      preferredLocation: ["Islamabad", "Gilgit", "Karachi", "Lahore"],
      educationPrefs: "Bachelor's or higher",
      professionPrefs: "Any",
    },
    familyIntro:
      "My family lives in Gilgit. My father is a businessman and my mother teaches at a local school.",
  },
  {
    id: "demo-profile-3",
    userId: "demo-user-3",
    fullName: "Sana Rahim",
    age: 28,
    gender: "Female",
    heightCm: 160,
    city: "Lahore",
    district: "Ghizer",
    profession: "Education",
    education: "MPhil / MS",
    maritalStatus: "Never married",
    languages: ["Urdu", "English", "Khowar"],
    aboutMe:
      "I teach at a university in Lahore and am pursuing my MPhil in education policy. My family is originally from Gupis in Ghizer.",
    qualitiesValued:
      "Respect, shared values, ambition balanced with humility, and a desire to give back to the community.",
    connectionToGB: "Family from Gupis, Ghizer",
    badges: ["email", "phone", "identity", "community", "profileApproved"],
    preferences: {
      preferredAgeMin: 28,
      preferredAgeMax: 34,
      preferredLocation: ["Lahore", "Islamabad", "Ghizer"],
      educationPrefs: "Master's or higher",
      professionPrefs: "Any",
    },
    familyIntro:
      "We are an extended family with roots in Ghizer. Both my parents are educators.",
  },
  {
    id: "demo-profile-4",
    userId: "demo-user-4",
    fullName: "Imran Shah",
    age: 33,
    gender: "Male",
    heightCm: 175,
    city: "Gilgit",
    district: "Nagar",
    profession: "Business / Self-employed",
    education: "Bachelor's",
    maritalStatus: "Never married",
    languages: ["Urdu", "English", "Burushaski"],
    aboutMe:
      "I run a small tourism and hospitality business based in Gilgit, working across the Karakoram. I value tradition, family, and meaningful work in the mountains.",
    qualitiesValued:
      "Warmth, honesty, groundedness, and a willingness to build a life together.",
    connectionToGB: "Born in Nagar",
    badges: ["email", "phone", "identity", "community", "profileApproved"],
    preferences: {
      preferredAgeMin: 25,
      preferredAgeMax: 32,
      preferredLocation: ["Gilgit", "Hunza", "Nagar"],
      educationPrefs: "Bachelor's or higher",
      professionPrefs: "Any",
    },
    familyIntro:
      "My family has lived in Nagar for generations. We run a small family business together.",
  },
  {
    id: "demo-profile-5",
    userId: "demo-user-5",
    fullName: "Zahra Nasir",
    age: 25,
    gender: "Female",
    heightCm: 162,
    city: "Karachi",
    district: "Hunza",
    profession: "Finance / Banking",
    education: "Bachelor's",
    maritalStatus: "Never married",
    languages: ["Urdu", "English"],
    aboutMe:
      "I work in banking in Karachi. My family is from Aliabad, Hunza, and we visit every summer. I am looking for a thoughtful, family-oriented partner.",
    qualitiesValued:
      "Faith, family devotion, financial responsibility, and emotional availability.",
    connectionToGB: "Family from Aliabad, Hunza",
    badges: ["email", "phone", "identity", "community", "profileApproved"],
    preferences: {
      preferredAgeMin: 26,
      preferredAgeMax: 32,
      preferredLocation: ["Karachi", "Islamabad", "Hunza"],
      educationPrefs: "Bachelor's or higher",
      professionPrefs: "Any",
    },
    familyIntro:
      "My parents moved from Hunza to Karachi in the 1990s. My father is in business and my mother is a homemaker.",
  },
  {
    id: "demo-profile-6",
    userId: "demo-user-6",
    fullName: "Bilal Hussain",
    age: 29,
    gender: "Male",
    heightCm: 180,
    city: "Islamabad",
    district: "Astore",
    profession: "Government / Public Sector",
    education: "Master's",
    maritalStatus: "Never married",
    languages: ["Urdu", "English", "Shina"],
    aboutMe:
      "Civil servant posted in Islamabad, originally from Astore. I value faith, family, and serving the community. I read widely and enjoy the outdoors.",
    qualitiesValued:
      "Patience, integrity, a sense of purpose, and shared commitment to family life.",
    connectionToGB: "Born in Astore",
    badges: ["email", "phone", "identity", "community", "profileApproved"],
    preferences: {
      preferredAgeMin: 24,
      preferredAgeMax: 30,
      preferredLocation: ["Islamabad", "Rawalpindi", "Astore"],
      educationPrefs: "Bachelor's or higher",
      professionPrefs: "Any",
    },
    familyIntro:
      "My family is from Astore. My father served in the public sector and my mother is a homemaker.",
  },
];

export const DEMO_SUCCESS_STORIES = [
  {
    id: "ss-1",
    partner1Name: "A. & S.",
    partner2Name: "",
    story:
      "We were introduced through GarMinas in the spring of 2024. Our families connected first, and over the following months we came to know each other with patience and respect. We were married in Hunza in the winter of the same year. We are grateful for a platform that valued privacy and dignity throughout.",
    introductionDate: "2024-03-15",
    publishedAt: "2025-01-20",
    consentBoth: true,
  },
  {
    id: "ss-2",
    partner1Name: "F. & N.",
    partner2Name: "",
    story:
      "After years of searching within our community, GarMinas connected our families across two cities. The structured proposal process gave both sides the space to ask the right questions. We are now building our life together in Islamabad.",
    introductionDate: "2024-07-01",
    publishedAt: "2025-02-10",
    consentBoth: true,
  },
];

export const GUIDANCE_ARTICLES = [
  {
    slug: "preparing-profile",
    title: "Preparing a Matrimonial Profile",
    category: "Profile",
    summary:
      "How to present yourself honestly and respectfully to the GarMinas community.",
    order: 1,
  },
  {
    slug: "respectful-communication",
    title: "Communicating Respectfully",
    category: "Communication",
    summary:
      "Principles for dignified, intentional conversations during introductions.",
    order: 2,
  },
  {
    slug: "understanding-compatibility",
    title: "Understanding Compatibility",
    category: "Matchmaking",
    summary:
      "What GarMinas can and cannot infer about compatibility.",
    order: 3,
  },
  {
    slug: "family-discussions",
    title: "Family Discussions",
    category: "Family",
    summary:
      "How to involve family members productively and respectfully.",
    order: 4,
  },
  {
    slug: "privacy-online-safety",
    title: "Privacy and Online Safety",
    category: "Safety",
    summary:
      "Practical steps to protect your information and stay safe.",
    order: 5,
  },
  {
    slug: "recognizing-fraud",
    title: "Recognizing Matrimonial Fraud",
    category: "Safety",
    summary:
      "Warning signs of scams and financial requests, and how to report them.",
    order: 6,
  },
];
