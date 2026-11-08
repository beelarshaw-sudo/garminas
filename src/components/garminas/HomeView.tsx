"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import dynamic from "next/dynamic";
import { useNav } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Shield,
  Lock,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Search,
  UserPlus,
  HandHeart,
  ChevronRight,
  CreditCard,
  Smartphone,
  Wallet,
  Building2,
  Globe2,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useRef } from "react";

// Lazy-load the heavy 3D scene as a separate chunk
const CinematicHero3D = dynamic(
  () => import("@/components/garminas/CinematicHero3D").then((m) => m.CinematicHero3D),
  {
    ssr: false,
    loading: () => (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, #FAF7F0 0%, #F3EEE2 45%, #E9DFD0 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 1.5 }}
          className="relative"
        >
          <svg viewBox="0 0 200 60" className="w-32 h-12">
            <circle cx="70" cy="30" r="18" fill="none" stroke="#D6B77A" strokeWidth="1.5" opacity="0.5" />
            <circle cx="130" cy="30" r="18" fill="none" stroke="#D6B77A" strokeWidth="1.5" opacity="0.5" />
          </svg>
        </motion.div>
      </div>
    ),
  }
);

// ─── Section: Why Choose Us ────────────────────────────────────────────────
const WHY = [
  {
    icon: Shield,
    title: "Verified Members",
    body: "Multi-layer verification — email, phone, identity, community eligibility, and profile moderation — establishes trust before any introduction.",
  },
  {
    icon: Lock,
    title: "Privacy-First",
    body: "You control who sees your photographs, your profile, and your family information. No public directory. No search engine indexing.",
  },
  {
    icon: Heart,
    title: "Genuine Intentions",
    body: "Every member confirms a sincere intention to pursue marriage. This is not a casual dating application.",
  },
  {
    icon: Users,
    title: "Cultural Understanding",
    body: "Built for a community that values family, respect, and lifelong commitment — without assuming every member shares the same traditions.",
  },
];

// ─── Section: How It Works ─────────────────────────────────────────────────
const STEPS = [
  {
    n: "01",
    icon: UserPlus,
    title: "Create Your Profile",
    body: "Build a thoughtful matrimonial profile with personal, educational, professional, and family sections. Complete verification to establish trust.",
  },
  {
    n: "02",
    icon: Search,
    title: "Discover Compatible Individuals",
    body: "Receive transparent, preference-based recommendations. Explore profiles with clear compatibility summaries and verified badges.",
  },
  {
    n: "03",
    icon: HandHeart,
    title: "Build a Meaningful Connection",
    body: "Send a matrimonial proposal. After acceptance, begin a respectful private conversation. Optionally involve trusted family members.",
  },
];

// ─── Featured demo profiles (clearly labelled) ─────────────────────────────
const FEATURED = [
  {
    name: "Aaliyah, 26",
    location: "Karachi · Pakistan",
    profession: "Public Health",
    education: "Master's",
    about: "Public health researcher who values family, faith, and intentional living.",
  },
  {
    name: "Daniyal, 30",
    location: "Toronto · Canada",
    profession: "Software Engineer",
    education: "Master's",
    about: "Engineer who enjoys hiking and reading, seeking a marriage built on mutual respect.",
  },
  {
    name: "Sana, 28",
    location: "London · United Kingdom",
    profession: "Educator",
    education: "MPhil",
    about: "University teacher pursuing education policy, looking for shared values and purpose.",
  },
];

const FAQS = [
  {
    q: "Who is this platform for?",
    a: "GarMinas is exclusively for adults aged 18 and above who belong to the global Ismaili community and have a genuine intention to pursue marriage. It is not a dating application.",
  },
  {
    q: "How does verification work?",
    a: "We use multiple verification layers: email, mobile OTP, identity document review by an authorized reviewer, discreet community eligibility verification through approved references, and profile/photograph moderation.",
  },
  {
    q: "Is my information private?",
    a: "Yes. You control who can view your photographs, your profile, your family information, and whether you appear in search results. There is no public member directory and no search engine indexing.",
  },
  {
    q: "Can my family participate?",
    a: "Yes, optionally. You can authorize a trusted family representative with limited permissions to participate in selected introductions. You retain full control and can revoke authorization at any time.",
  },
];

export function HomeView() {
  const { setView } = useNav();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════════
          CINEMATIC HERO — CSS 3D golden rings + heart + particles
          Warm champagne background with two interlocking golden rings,
          a breathing heart formation, champagne bubbles, rose petals,
          and a sparkle star field.
          ═══════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative h-screen overflow-hidden"
        style={{
          marginTop: "-4rem",
          background:
            "radial-gradient(ellipse at 50% 40%, #FAF7F0 0%, #F3EEE2 40%, #E9DFD0 100%)",
        }}
      >
        {/* CSS 3D animation fills the entire viewport */}
        <div className="absolute inset-0 z-0">
          <CinematicHero3D className="h-full w-full" />
        </div>

        {/* Soft vignette for text legibility (lighter, since rings are on light bg) */}
        <div
          className="absolute inset-x-0 top-0 z-10 pointer-events-none h-2/3"
          style={{
            background:
              "linear-gradient(180deg, rgba(250,247,240,0.5) 0%, rgba(250,247,240,0.2) 50%, transparent 100%)",
          }}
        />

        {/* Hero content overlay */}
        <motion.div
          style={{ opacity: heroTextOpacity, y: heroTextY }}
          className="relative z-20 flex h-full flex-col items-center justify-center px-4 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="mb-6 text-xs font-medium uppercase tracking-[0.35em]"
            style={{ color: "#B8964A" }}
          >
            Where Two Journeys Become One
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
            className="font-serif text-4xl font-semibold leading-[1.1] sm:text-5xl md:text-6xl lg:text-7xl"
            style={{
              color: "#111827",
              textShadow:
                "0 2px 24px rgba(250,247,240,0.7), 0 1px 8px rgba(250,247,240,0.5)",
              maxWidth: "900px",
            }}
          >
            A Beautiful Beginning.
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #D6B77A 0%, #B8964A 50%, #E8D9B5 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              A Lifetime Together.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg"
            style={{
              color: "#6B6457",
              textShadow: "0 1px 12px rgba(250,247,240,0.6)",
            }}
          >
            Discover meaningful connections rooted in shared values, genuine
            intentions, and the promise of lifelong companionship.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              onClick={() => setView("register")}
              className="shadow-lux-lg"
              style={{
                background: "linear-gradient(135deg, #E8D9B5 0%, #D6B77A 50%, #B8964A 100%)",
                color: "#111827",
                border: "1px solid rgba(248,231,176,0.4)",
              }}
            >
              <Heart className="mr-2 h-4 w-4" />
              Find Your Life Partner
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setView("about")}
              className="border-gold/50 bg-white/70 text-navy backdrop-blur hover:bg-white/90"
            >
              How It Works
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>

          {/* Global trust indicator */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.4 }}
            className="mt-6 flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur"
            style={{
              borderColor: "rgba(184,150,74,0.35)",
              background: "rgba(255,255,255,0.55)",
              color: "#6B6457",
            }}
          >
            <Globe2 className="h-3.5 w-3.5" style={{ color: "#B8964A" }} />
            Trusted by Ismailis in 30+ countries
          </motion.div>

          {/* Trust indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.6 }}
            className="mt-8 flex items-center gap-6 text-xs"
            style={{ color: "#6B6457" }}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#B8964A" }} />
              Verified profiles
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" style={{ color: "#B8964A" }} />
              Privacy-first
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" style={{ color: "#B8964A" }} />
              Matrimonial-only
            </span>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1"
            style={{ color: "rgba(107,100,87,0.5)" }}
          >
            <span className="text-[10px] uppercase tracking-widest">Scroll</span>
            <ChevronRight className="h-4 w-4 rotate-90" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SUBSCRIPTION PRICING — Required to join GarMinas
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p
              className="mb-3 text-xs uppercase tracking-[0.25em]"
              style={{ color: "#B8964A" }}
            >
              Membership Required
            </p>
            <h2
              className="font-serif text-3xl font-semibold sm:text-4xl"
              style={{ color: "#111827" }}
            >
              A subscription for serious intentions
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              GarMinas is built for individuals genuinely seeking marriage. The monthly
              subscription ensures every member is committed, verified, and serious about
              finding a life partner.
            </p>
          </div>

          {/* Pricing card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-md"
          >
            <Card
              className="relative overflow-hidden border-gold/40 shadow-lux-lg"
              style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FAF7F0 100%)" }}
            >
              {/* Gold top bar */}
              <div
                className="h-1.5"
                style={{ background: "linear-gradient(90deg, #E8D9B5, #D6B77A, #B8964A)" }}
              />
              <CardContent className="p-8 text-center">
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "linear-gradient(135deg, #E8D9B5, #D6B77A)" }}
                >
                  <CreditCard className="h-6 w-6" style={{ color: "#111827" }} />
                </div>
                <h3 className="font-serif text-xl font-semibold" style={{ color: "#111827" }}>
                  Monthly Subscription
                </h3>
                <div className="my-6">
                  <span
                    className="font-serif text-6xl font-bold"
                    style={{
                      background: "linear-gradient(135deg, #D6B77A, #B8964A)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    18
                  </span>
                  <span className="ml-2 text-lg text-muted-foreground">USD / month</span>
                </div>
                <div className="mb-6 space-y-2 text-left">
                  {[
                    "Create your verified profile",
                    "Upload ID card + documents for verification",
                    "Browse matched member profiles",
                    "Send and receive matrimonial proposals",
                    "Private messaging after acceptance",
                    "Family involvement features",
                    "Priority support",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2
                        className="h-4 w-4 shrink-0"
                        style={{ color: "#D6B77A" }}
                      />
                      <span style={{ color: "#111827" }}>{item}</span>
                    </div>
                  ))}
                </div>
                <Button
                  size="lg"
                  className="w-full shadow-lux-lg"
                  onClick={() => setView("register")}
                  style={{
                    background: "linear-gradient(135deg, #E8D9B5 0%, #D6B77A 50%, #B8964A 100%)",
                    color: "#111827",
                  }}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Subscribe & Create Account
                </Button>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Payment via EasyPaisa, JazzCash, SadaPay, Bank Transfer, or Card.
                  Account is activated after document + payment verification.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment methods row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Smartphone className="h-4 w-4" style={{ color: "#00A651" }} /> EasyPaisa
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4" style={{ color: "#ED1C24" }} /> JazzCash
            </span>
            <span className="flex items-center gap-1.5">
              <Wallet className="h-4 w-4" style={{ color: "#6C5CE7" }} /> SadaPay
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" style={{ color: "#2D3436" }} /> Bank Transfer
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" style={{ color: "#0984E3" }} /> Credit/Debit Card
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION A: Begin Your Journey — Profile discovery
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-lux-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p
              className="mb-3 text-xs uppercase tracking-[0.25em]"
              style={{ color: "#B8964A" }}
            >
              Begin Your Journey
            </p>
            <h2
              className="font-serif text-3xl font-semibold sm:text-4xl"
              style={{ color: "#111827" }}
            >
              Discover profiles rooted in shared values
            </h2>
          </div>

          {/* Search/filter bar */}
          <Card className="mx-auto max-w-3xl border-gold/30 bg-white/80 shadow-lux backdrop-blur">
            <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Age range
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="22"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <span className="text-muted-foreground">–</span>
                  <input
                    type="number"
                    placeholder="35"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Location
                </label>
                <select className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option>Any location</option>
                  <option>Karachi, Pakistan</option>
                  <option>Toronto, Canada</option>
                  <option>London, UK</option>
                  <option>Dubai, UAE</option>
                  <option>Lisbon, Portugal</option>
                  <option>Nairobi, Kenya</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  style={{
                    background: "linear-gradient(135deg, #D6B77A, #B8964A)",
                    color: "#111827",
                  }}
                  onClick={() => setView("discover")}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Sign in to view verified member profiles with full compatibility details.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION B: How It Works — Three steps
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              How It Works
            </p>
            <h2
              className="font-serif text-3xl font-semibold sm:text-4xl"
              style={{ color: "#111827" }}
            >
              A structured, respectful path to marriage
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative text-center"
              >
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full">
                  <div
                    className="flex h-full w-full items-center justify-center rounded-full"
                    style={{
                      background: "linear-gradient(135deg, #E8D9B5, #D6B77A)",
                    }}
                  >
                    <step.icon className="h-6 w-6" style={{ color: "#111827" }} />
                  </div>
                </div>
                <div
                  className="mb-2 font-serif text-3xl font-bold"
                  style={{ color: "rgba(214,183,122,0.4)" }}
                >
                  {step.n}
                </div>
                <h3
                  className="mb-2 font-serif text-lg font-semibold"
                  style={{ color: "#111827" }}
                >
                  {step.title}
                </h3>
                <p className="mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
                {i < STEPS.length - 1 && (
                  <ChevronRight
                    className="hidden md:block absolute -right-4 top-7 h-6 w-6"
                    style={{ color: "rgba(214,183,122,0.3)" }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION C: Featured Profiles
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-lux-gradient py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Featured Profiles
            </p>
            <h2
              className="font-serif text-3xl font-semibold sm:text-4xl"
              style={{ color: "#111827" }}
            >
              Members seeking meaningful connections
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURED.map((profile, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full border-gold/30 bg-white shadow-lux transition-all hover:shadow-lux-lg">
                  <CardContent className="p-6">
                    {/* Avatar placeholder with initials */}
                    <div
                      className="mb-4 flex h-16 w-16 items-center justify-center rounded-full font-serif text-xl font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #E8D9B5, #D6B77A)",
                        color: "#111827",
                      }}
                    >
                      {profile.name.split(",")[0][0]}
                    </div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3
                        className="font-serif text-lg font-semibold"
                        style={{ color: "#111827" }}
                      >
                        {profile.name}
                      </h3>
                      <CheckCircle2 className="h-4 w-4" style={{ color: "#D6B77A" }} />
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {profile.location}
                    </p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: "rgba(214,183,122,0.15)", color: "#B8964A" }}
                      >
                        {profile.profession}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{ background: "rgba(200,143,145,0.15)", color: "#A07072" }}
                      >
                        {profile.education}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {profile.about}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full border-gold/40"
                      onClick={() => setView("register")}
                    >
                      View profile
                      <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button variant="ghost" onClick={() => setView("discover")}>
              Discover more members
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Profile information shown with member consent. Photographs and detailed
            information are visible only to verified, approved members.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION D: Why Choose Us
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-navy-gradient py-20 sm:py-28 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/60">
              Why Choose Us
            </p>
            <h2 className="font-serif text-3xl font-semibold sm:text-4xl">
              Trust, privacy, and cultural understanding
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div
                    className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: "linear-gradient(135deg, #E8D9B5, #D6B77A)" }}
                  >
                    <item.icon className="h-6 w-6" style={{ color: "#111827" }} />
                  </div>
                  <h3 className="mb-2 font-serif text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-white/70">{item.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION E: Success Stories
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Success Stories
            </p>
            <h2
              className="font-serif text-3xl font-semibold sm:text-4xl"
              style={{ color: "#111827" }}
            >
              Stories of forever
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Shared with the explicit consent of both individuals.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[
              {
                couple: "A. & S.",
                excerpt:
                  "We were introduced through GarMinas in the spring of 2024. Our families connected first, and over the following months we came to know each other with patience and respect.",
              },
              {
                couple: "F. & N.",
                excerpt:
                  "After years of searching within our community, GarMinas connected our families across two cities. The structured proposal process gave both sides space to ask the right questions.",
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full border-gold/30 shadow-lux">
                  <CardContent className="p-8">
                    <div
                      className="mb-4 font-serif text-4xl font-semibold"
                      style={{
                        background: "linear-gradient(135deg, #D6B77A, #B8964A)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      }}
                    >
                      {s.couple}
                    </div>
                    <p className="font-serif text-base italic leading-relaxed text-muted-foreground">
                      “{s.excerpt}”
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION F: Final Call to Action — "Your Next Chapter Starts Here"
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: "linear-gradient(180deg, #111827 0%, #1A2233 100%)" }}>
        {/* Architectural decorative arch silhouette */}
        <div className="absolute inset-0 opacity-20" aria-hidden>
          <svg viewBox="0 0 1200 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <linearGradient id="archGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D6B77A" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#D6B77A" stopOpacity="0" />
              </linearGradient>
            </defs>
            {[200, 400, 600, 800, 1000].map((x) => (
              <path
                key={x}
                d={`M ${x - 60} 400 L ${x - 60} 120 Q ${x} 40 ${x + 60} 120 L ${x + 60} 400`}
                fill="none"
                stroke="url(#archGold)"
                strokeWidth="1.5"
              />
            ))}
          </svg>
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <Sparkles className="mx-auto mb-4 h-8 w-8" style={{ color: "#D6B77A" }} />
          <h2 className="font-serif text-3xl font-semibold sm:text-4xl md:text-5xl text-white">
            Your Next Chapter Starts Here.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70">
            Join a respectful, verified, and private matrimonial community built
            for meaningful marriage proposals.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={() => setView("register")}
              className="shadow-lux-lg"
              style={{
                background: "linear-gradient(135deg, #E8D9B5 0%, #D6B77A 50%, #B8964A 100%)",
                color: "#111827",
              }}
            >
              <Heart className="mr-2 h-4 w-4" />
              Create Your Account
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION G: Footer (minimal, elegant)
          ═══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t" style={{ borderColor: "rgba(214,183,122,0.25)", background: "#0F1419" }}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <svg viewBox="0 0 36 36" className="h-8 w-8">
                  <circle cx="14" cy="18" r="8" fill="none" stroke="#D6B77A" strokeWidth="2.5" />
                  <circle cx="22" cy="18" r="8" fill="none" stroke="#D6B77A" strokeWidth="2.5" />
                </svg>
                <span className="font-serif text-xl font-semibold text-white">GarMinas</span>
              </div>
              <p className="font-serif text-sm italic text-white/70">
                A Connection That Leads to Forever.
              </p>
            </div>
            <div>
              <h4 className="mb-3 font-serif text-sm font-semibold text-white/90">Platform</h4>
              <ul className="space-y-2 text-xs text-white/60">
                <li><button onClick={() => setView("about")} className="hover:text-white">About Us</button></li>
                <li><button onClick={() => setView("success-stories")} className="hover:text-white">Success Stories</button></li>
                <li><button onClick={() => setView("help")} className="hover:text-white">How It Works</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-serif text-sm font-semibold text-white/90">Trust & Safety</h4>
              <ul className="space-y-2 text-xs text-white/60">
                <li><button onClick={() => setView("verify")} className="hover:text-white">Verification</button></li>
                <li><button onClick={() => setView("safety")} className="hover:text-white">Safety Centre</button></li>
                <li><button onClick={() => setView("privacy")} className="hover:text-white">Privacy Centre</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 font-serif text-sm font-semibold text-white/90">Account</h4>
              <ul className="space-y-2 text-xs text-white/60">
                <li><button onClick={() => setView("login")} className="hover:text-white">Login</button></li>
                <li><button onClick={() => setView("register")} className="hover:text-white">Create Account</button></li>
                <li><button onClick={() => setView("legal-terms")} className="hover:text-white">Terms & Policies</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-white/10 pt-6">
            <p className="text-[11px] leading-relaxed text-white/40">
              © {new Date().getFullYear()} GarMinas. All rights reserved. GarMinas facilitates
              introductions; it does not guarantee marriage, compatibility, identity beyond the
              stated verification level, or the conduct of members. This platform is exclusively
              intended for adult Ismailis worldwide and is dedicated solely to matrimonial
              purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
