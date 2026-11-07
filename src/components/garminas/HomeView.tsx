"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useNav } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Shield,
  Lock,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Bell,
  HeartHandshake,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Hero3D = dynamic(() => import("@/components/garminas/Hero3DCSS"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative h-32 w-32"
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <circle cx="38" cy="50" r="22" fill="none" stroke="#D6B77A" strokeWidth="3" opacity="0.6" />
          <circle cx="62" cy="50" r="22" fill="none" stroke="#D6B77A" strokeWidth="3" opacity="0.6" />
        </svg>
      </motion.div>
    </div>
  ),
});

const RomanticAudio = dynamic(
  () => import("@/components/garminas/RomanticAudio").then((m) => m.RomanticAudio),
  { ssr: false, loading: () => null }
);

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
    title: "Matrimonial-Only",
    body: "GarMinas is not a dating application. Every member confirms a genuine intention to pursue marriage.",
  },
  {
    icon: HeartHandshake,
    title: "Family Involvement",
    body: "Optional, authorized family participation — dignified, controlled, and respectful of community traditions.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Register & Verify",
    body: "Create your account with email and phone verification. Confirm your Ismaili community eligibility and matrimonial-only intention.",
  },
  {
    n: "02",
    title: "Complete Your Profile",
    body: "Build a thoughtful matrimonial profile across personal, educational, professional, family, and preference sections.",
  },
  {
    n: "03",
    title: "Discover & Express Interest",
    body: "Receive transparent, rules-based recommendations. Send a matrimonial proposal to a member whose preferences align with yours.",
  },
  {
    n: "04",
    title: "Connect with Dignity",
    body: "After acceptance, begin a respectful private conversation. Optionally involve trusted family members in the introduction.",
  },
];

const FAQS = [
  {
    q: "Who is GarMinas for?",
    a: "GarMinas is exclusively for adults aged 18 and above who are connected to the Ismaili community of Gilgit-Baltistan and have a genuine intention to pursue marriage. It is not a dating application.",
  },
  {
    q: "How does verification work?",
    a: "GarMinas uses multiple verification layers: email, mobile OTP, identity document review by an authorized reviewer, discreet Ismaili community eligibility verification through approved references, and profile/photograph moderation. Religious identity is never inferred from a name, location or appearance.",
  },
  {
    q: "Is my information private?",
    a: "Yes. You control who can view your photographs, your profile, your family information, and whether you appear in search results. There is no public member directory and no search engine indexing. GarMinas never sells member information.",
  },
  {
    q: "Can my family participate?",
    a: "Yes, optionally. You can authorize a trusted family representative with limited permissions to participate in selected introductions. You retain full control and can revoke authorization at any time.",
  },
  {
    q: "Does GarMinas guarantee marriage?",
    a: "No. GarMinas facilitates respectful introductions between verified members. It does not guarantee marriage, compatibility, identity beyond the stated verification level, or the conduct of members.",
  },
  {
    q: "How much does it cost?",
    a: "Account registration, profile creation, verification, and basic matchmaking discovery are free. Verification badges are never sold. Future premium membership options may offer additional tools, but privacy and basic safety features will always remain free.",
  },
];

export function HomeView() {
  const { setView } = useNav();

  return (
    <div>
      {/* HERO — cinematic 3D animation: golden rings, heart formation, champagne bubbles, sparkles */}
      <section className="relative min-h-[96vh] overflow-hidden flex flex-col">
        {/* Base gradient (warm champagne ambience) */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, #FAF7F0 0%, #F3EEE2 45%, #E9DFD0 100%)",
          }}
        />
        {/* The rich 3D scene fills the entire hero */}
        <div className="absolute inset-0 z-0">
          <Hero3D className="h-full w-full" />
        </div>
        {/* Soft ivory vignette over the upper text region for headline legibility */}
        <div
          className="absolute inset-x-0 top-0 z-10 pointer-events-none"
          style={{
            height: "50%",
            background:
              "linear-gradient(180deg, rgba(250,247,240,0.55) 0%, rgba(250,247,240,0.25) 60%, transparent 100%)",
          }}
        />

        {/* Top-right: ambient music toggle */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30">
          <RomanticAudio />
        </div>

        {/* Text content */}
        <div className="relative z-20 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center pt-24 sm:pt-32 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4">
              An exclusive Ismaili matrimonial community
            </p>
            <h1
              className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] text-balance"
              style={{
                color: "var(--navy)",
                textShadow: "0 2px 24px rgba(250, 247, 240, 0.7)",
              }}
            >
              Your Journey to
              <br />
              <span className="text-gold-gradient">Forever</span> Begins Here.
            </h1>
            <p
              className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed"
              style={{
                color: "var(--navy)",
                textShadow: "0 1px 16px rgba(250, 247, 240, 0.85)",
              }}
            >
              GarMinas brings eligible Ismailis connected to Gilgit-Baltistan
              together through a secure, sophisticated and respectful matchmaking
              experience — built on trust, privacy, and a genuine commitment to
              marriage.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => setView("register")}
                className="text-navy shadow-lux-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #E8D9B5 0%, #D6B77A 50%, #B8964A 100%)",
                }}
              >
                <Heart className="mr-2 h-4 w-4" />
                Register Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView("about")}
                className="border-gold bg-white/85 backdrop-blur"
              >
                Explore How It Works
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Spacer for visual breathing room at the bottom of the hero */}
        <div className="relative z-10 h-[14vh] min-h-[100px]" />

        {/* Disclaimer pinned at the very bottom of hero */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-20 mx-auto max-w-xl px-4 text-center text-xs text-muted-foreground mb-6"
        >
          GarMinas is exclusively intended for adult Ismailis connected to
          Gilgit-Baltistan and is dedicated solely to matrimonial purposes.
        </motion.p>
      </section>

      {/* WHY GARMINAS */}
      <section className="py-20 sm:py-28 bg-lux-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Why GarMinas</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold" style={{ color: "var(--navy)" }}>
              Trust, Privacy, and Meaningful Connection
            </h2>
            <div className="mx-auto mt-4 h-px w-24" style={{ background: "linear-gradient(90deg, transparent, #D6B77A, transparent)" }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full shadow-lux border-gold/40 bg-white/80 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, #E8D9B5, #D6B77A)" }}>
                      <item.icon className="h-6 w-6" style={{ color: "var(--navy)" }} />
                    </div>
                    <h3 className="font-serif text-lg font-semibold mb-2" style={{ color: "var(--navy)" }}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">How Matchmaking Works</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold" style={{ color: "var(--navy)" }}>
              A Structured, Respectful Path to Marriage
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative"
              >
                <div className="font-serif text-5xl font-bold mb-3" style={{ color: "rgba(214, 183, 122, 0.5)" }}>
                  {step.n}
                </div>
                <h3 className="font-serif text-lg font-semibold mb-2" style={{ color: "var(--navy)" }}>
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute -right-3 top-12 h-6 w-6 text-gold/40" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST & VERIFICATION */}
      <section className="py-20 sm:py-28 bg-navy-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-white/60 mb-3">Community Trust</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">
                Verification that respects dignity
              </h2>
              <p className="text-white/70 leading-relaxed mb-6">
                GarMinas establishes trust through multiple verification layers — without ever inferring religious identity from a name, location or appearance. Community eligibility is discreetly confirmed by authorized reviewers using approved references, never by exposing sensitive documents publicly.
              </p>
              <div className="space-y-3">
                {[
                  "Email & mobile OTP verification",
                  "Identity document review by authorized reviewers",
                  "Discreet Ismaili community eligibility verification",
                  "Profile and photograph moderation before publication",
                  "Clear, honest badges: Phone Verified, Identity Verified, Community Verified, Profile Approved",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: "var(--gold)" }} />
                    <span className="text-sm text-white/80">{item}</span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="lg"
                className="mt-6 border-white/30 text-white hover:bg-white/10"
                onClick={() => setView("verify")}
              >
                Explore Verification
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Shield, label: "Identity Verified", desc: "Reviewed by authorized reviewer" },
                { icon: Users, label: "Community Verified", desc: "Discreet eligibility confirmation" },
                { icon: Lock, label: "Profile Approved", desc: "Moderated before publication" },
                { icon: Bell, label: "Phone Verified", desc: "OTP-confirmed mobile" },
              ].map((b) => (
                <div key={b.label} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5">
                  <b.icon className="h-7 w-7 mb-3" style={{ color: "var(--gold)" }} />
                  <div className="font-serif text-base font-semibold">{b.label}</div>
                  <div className="text-xs text-white/60 mt-1">{b.desc}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* PRIVACY HIGHLIGHTS */}
      <section className="py-20 sm:py-28 bg-lux-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Privacy & Security</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold" style={{ color: "var(--navy)" }}>
              Your privacy, in your hands
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                title: "Control your visibility",
                body: "Decide who sees your photographs, your profile, and your family information. Temporarily hide your profile or pause for inactivity any time.",
              },
              {
                title: "No public directory",
                body: "There is no publicly searchable member directory. Profiles are only visible to other verified, approved members within the GarMinas community.",
              },
              {
                title: "Never sold, never trained on",
                body: "GarMinas never sells member information and never uses member photographs for AI training or marketing without separate explicit consent.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full shadow-lux border-gold/40 bg-white">
                  <CardContent className="p-6">
                    <h3 className="font-serif text-lg font-semibold mb-2" style={{ color: "var(--navy)" }}>
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" className="border-gold" onClick={() => setView("privacy")}>
              Explore the Privacy Centre
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* SUCCESS STORIES PREVIEW */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Featured Stories</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold" style={{ color: "var(--navy)" }}>
              Stories of Forever
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              Shared with the explicit consent of both individuals. Never automatically published.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                key={s.couple}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full shadow-lux border-gold/40">
                  <CardContent className="p-8">
                    <div className="font-serif text-4xl font-semibold text-gold-gradient mb-4">
                      {s.couple}
                    </div>
                    <p className="font-serif italic text-base text-muted-foreground leading-relaxed">
                      “{s.excerpt}”
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="ghost" size="lg" onClick={() => setView("success-stories")}>
              Read more stories
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* GUIDANCE PREVIEW */}
      <section className="py-16 bg-lux-gradient">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 mb-3" style={{ color: "var(--gold)" }} />
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold mb-3" style={{ color: "var(--navy)" }}>
            The Matrimonial Guidance Library
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-6">
            Practical guidance on preparing a matrimonial profile, communicating respectfully, involving family, protecting your privacy, and recognizing matrimonial fraud.
          </p>
          <Button variant="outline" className="border-gold" onClick={() => setView("guidance")}>
            <BookOpen className="mr-2 h-4 w-4" />
            Explore the Library
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-3">Frequently Asked Questions</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold" style={{ color: "var(--navy)" }}>
              Questions, answered
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="rounded-xl border border-gold/30 bg-lux-gradient px-5">
                <AccordionTrigger className="font-serif text-base font-medium hover:no-underline text-left" style={{ color: "var(--navy)" }}>
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 sm:py-28 bg-navy-gradient text-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">
              A Connection That Leads to Forever.
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Join a respectful, verified, and private matrimonial community built for Ismailis connected to Gilgit-Baltistan.
            </p>
            <Button
              size="lg"
              onClick={() => setView("register")}
              className="text-navy shadow-lux-lg"
              style={{
                background: "linear-gradient(135deg, #E8D9B5 0%, #D6B77A 50%, #B8964A 100%)",
              }}
            >
              <Heart className="mr-2 h-4 w-4" />
              Begin Your Journey
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
