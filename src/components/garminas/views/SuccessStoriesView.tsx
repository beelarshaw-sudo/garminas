"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarHeart, Heart, Loader2, Quote, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Story {
  id: string;
  partner1Name: string;
  partner2Name: string;
  story: string;
  photoUrl?: string | null;
  introductionDate?: string | null;
  publishedAt?: string | null;
  status?: string;
  consentBoth: boolean;
  createdAt?: string;
}

function formatDate(value?: string | null): string {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function initialsLabel(name: string): string {
  return name?.trim() || "A & Z";
}

export default function SuccessStoriesView() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/success-stories", { cache: "no-store" });
        const data = await res.json();
        if (!active) return;
        setStories(Array.isArray(data?.stories) ? data.stories : []);
      } catch {
        if (active) toast.error("Could not load success stories.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-lux-gradient">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 md:py-28">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#C88F91]/15 blur-3xl animate-float-slow" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#D6B77A]/15 blur-3xl animate-float" />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-3xl mx-auto text-center relative"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <Heart className="h-6 w-6 text-[#C88F91]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-4">
            GarMinas · Stories
          </p>
          <h1 className="font-serif text-4xl md:text-6xl text-foreground leading-tight">
            Stories of{" "}
            <span className="text-gold-gradient">Forever</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Every journey begins with an introduction. These stories — shared
            with the explicit consent of both individuals — celebrate marriages
            that began here.
          </p>
        </motion.div>
      </section>

      <Separator className="bg-[#D6B77A]/20 max-w-5xl mx-auto" />

      {/* Stories grid */}
      <section className="px-4 py-16">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-[#D6B77A] mr-2" />
              Loading stories…
            </div>
          ) : stories.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="mx-auto h-8 w-8 text-[#D6B77A]/60 mb-4" />
              <p className="font-serif text-xl text-foreground">
                No stories have been published yet.
              </p>
              <p className="text-muted-foreground mt-2">
                Check back soon — new journeys are shared with consent.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {stories.map((story, idx) => (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.4,
                    ease: "easeOut",
                    delay: idx * 0.05,
                  }}
                >
                  <Card className="h-full bg-white border-[#D6B77A]/30 shadow-lux hover:shadow-lux-lg transition-shadow">
                    <CardContent className="p-6 md:p-8 flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#FAF7F0] to-[#E9DFD0] ring-gold">
                          <span className="font-serif text-lg text-[#111827]">
                            {initialsLabel(story.partner1Name)
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 3)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-serif text-xl text-foreground">
                            {story.partner1Name || "A loving couple"}
                          </p>
                          {(story.introductionDate || story.publishedAt) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                              <CalendarHeart className="h-3.5 w-3.5 text-[#C88F91]" />
                              Introduced{" "}
                              {formatDate(story.introductionDate) ||
                                "some time ago"}
                            </p>
                          )}
                        </div>
                      </div>
                      <Quote className="h-5 w-5 text-[#D6B77A]/60 mb-3" />
                      <p className="text-sm md:text-base text-foreground/80 leading-relaxed flex-1 italic">
                        {story.story}
                      </p>
                      <Separator className="bg-[#D6B77A]/20 my-5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {story.publishedAt
                            ? `Published ${formatDate(story.publishedAt)}`
                            : "Published with consent"}
                        </span>
                        {story.consentBoth && (
                          <span className="text-[#C88F91]">
                            Shared with both partners' consent
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Closing note */}
      <section className="px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-2xl mx-auto text-center"
        >
          <p className="text-sm text-muted-foreground italic">
            Stories are published only with the explicit consent of both
            individuals. If you met through GarMinas and would like to share your
            journey, please contact support.
          </p>
        </motion.div>
      </section>
    </div>
  );
}
