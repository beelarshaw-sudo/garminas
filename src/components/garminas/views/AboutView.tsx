"use client";

import { motion } from "framer-motion";
import {
  HeartHandshake,
  Lock,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNav } from "@/lib/store";

const SECTIONS = [
  {
    icon: MapPin,
    title: "Why GarMinas was created",
    body: "Across the global Ismaili community, families have long sought trustworthy, dignified ways to help their children find a spouse. Existing options were either informal — relying entirely on personal networks — or impersonal, exposed to scams and unsuitable introductions. GarMinas was created to fill that gap: a verified, privacy-first matrimonial platform built specifically for adult Ismailis worldwide, where every profile is reviewed and every introduction carries intent.",
  },
  {
    icon: ShieldCheck,
    title: "Trust and privacy at the core",
    body: "GarMinas never sells member information and never uses member photographs for marketing or AI training without separate explicit consent. Multi-layered verification — email, phone, identity, community and profile approval — ensures that every active member is real and known to the community. Sensitive matrimonial details are masked in notification previews, and you control who can view your photographs, who can find you in search, and how your family information appears.",
  },
  {
    icon: Users,
    title: "Community-first philosophy",
    body: "Marriage in our community is rarely an individual decision alone. GarMinas honours this by allowing optional, controlled family involvement through trusted representatives with limited permissions — never unrestricted access to private conversations or account credentials. Religious identity is never inferred from a name, location, profession, or photograph. Community verification is conducted discreetly through approved references by authorised reviewers.",
  },
  {
    icon: HeartHandshake,
    title: "Genuine marriage intentions",
    body: "GarMinas is dedicated solely to matrimonial purposes. It is not a dating application and not a casual chat network. Every member confirms, at registration, their intention to use the platform only for serious matrimonial purposes. Proposals move through a structured, respectful lifecycle — Sent, Delivered, Viewed, Accepted or Declined, Introduction Requested, Family Discussion, and Closed — that gives both individuals and their families the space to ask the right questions before any commitment is made.",
  },
];

export default function AboutView() {
  const setView = useNav((s) => s.setView);

  return (
    <div className="bg-lux-gradient">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#D6B77A]/15 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#C88F91]/10 blur-3xl animate-float" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center relative"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <Sparkles className="h-6 w-6 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-4">
            About GarMinas
          </p>
          <h1 className="font-serif text-4xl md:text-6xl text-foreground leading-tight text-balance">
            Bringing the right people together through{" "}
            <span className="text-gold-gradient">trust, respect</span> and{" "}
            <span className="text-gold-gradient">meaningful connections</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            An exclusive matrimonial community for adult Ismailis connected to
            the global Ismaili community — built on dignity, privacy and serious intention.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => setView("register")}
              className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
            >
              Begin your journey
            </Button>
            <Button
              variant="outline"
              onClick={() => setView("success-stories")}
              className="border-[#D6B77A]/40 hover:bg-[#F3EEE2]"
            >
              Read success stories
            </Button>
          </div>
        </motion.div>
      </section>

      <Separator className="bg-[#D6B77A]/20 max-w-5xl mx-auto" />

      {/* Sections */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto space-y-16">
          {SECTIONS.map((section, idx) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, ease: "easeOut", delay: idx * 0.05 }}
                className="grid md:grid-cols-[auto_1fr] gap-6 md:gap-8"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full ring-gold bg-white shadow-lux shrink-0">
                  <Icon className="h-6 w-6 text-[#D6B77A]" />
                </div>
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-3xl">
                    {section.body}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Closing card */}
      <section className="px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          <Card className="bg-white border-[#D6B77A]/30 shadow-lux-lg">
            <CardContent className="p-8 md:p-10 text-center">
              <Lock className="mx-auto h-8 w-8 text-[#D6B77A] mb-4" />
              <h3 className="font-serif text-2xl md:text-3xl text-foreground mb-3">
                A platform built with care
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
                GarMinas must never be used to solicit money, conduct scams, or
                harass other members. Every feature is designed to protect the
                dignity and safety of those seeking a spouse — and every member
                contributes to that trust.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setView("legal-conduct")}
                  variant="outline"
                  className="border-[#D6B77A]/40 hover:bg-[#F3EEE2]"
                >
                  Read our community standards
                </Button>
                <Button
                  onClick={() => setView("help")}
                  className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
                >
                  Visit the help centre
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}
