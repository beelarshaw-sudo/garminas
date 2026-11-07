"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArticleSummary {
  slug: string;
  title: string;
  category: string;
  summary: string;
  order: number;
}

interface ArticleFull extends ArticleSummary {
  body: string;
}

export default function GuidanceView() {
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<ArticleFull | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/guidance", { cache: "no-store" });
        if (!res.ok) {
          toast.error("Could not load guidance library.");
          return;
        }
        const data = await res.json();
        const list = Array.isArray(data?.articles) ? data.articles : [];
        list.sort((a: ArticleSummary, b: ArticleSummary) => a.order - b.order);
        setArticles(list);
      } catch {
        toast.error("Network error.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>(articles.map((a) => a.category));
    return ["All", ...Array.from(set)];
  }, [articles]);

  const filtered = useMemo(() => {
    if (activeCategory === "All") return articles;
    return articles.filter((a) => a.category === activeCategory);
  }, [articles, activeCategory]);

  async function openArticle(slug: string) {
    setOpenSlug(slug);
    setLoadingArticle(true);
    setActiveArticle(null);
    try {
      const res = await fetch(`/api/guidance?slug=${encodeURIComponent(slug)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not load article.");
        return;
      }
      setActiveArticle(data?.article ?? null);
    } catch {
      toast.error("Network error.");
    } finally {
      setLoadingArticle(false);
    }
  }

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-5xl mx-auto px-4 py-10 md:py-14"
      >
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <BookOpen className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Guidance library
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Matrimonial guidance
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Thoughtful, respectful guidance on preparing your profile,
            communicating with intention, and involving family well.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors border ${
                activeCategory === c
                  ? "bg-[#D6B77A] text-[#111827] border-[#D6B77A]"
                  : "bg-white text-muted-foreground border-[#D6B77A]/30 hover:bg-[#F3EEE2]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Articles grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-[#D6B77A] mr-2" /> Loading articles…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="mx-auto h-8 w-8 text-[#D6B77A]/50 mb-3" />
            <p className="font-serif text-lg text-foreground">No articles in this category yet.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {filtered.map((article, idx) => (
              <motion.div
                key={article.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, ease: "easeOut", delay: idx * 0.04 }}
              >
                <Card className="bg-white border-[#D6B77A]/30 shadow-lux hover:shadow-lux-lg transition-shadow h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <Badge variant="outline" className="border-[#D6B77A]/40 text-[#C88F91] text-xs w-fit mb-3">
                      {article.category}
                    </Badge>
                    <h3 className="font-serif text-lg text-foreground mb-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {article.summary}
                    </p>
                    <Button
                      variant="link"
                      onClick={() => openArticle(article.slug)}
                      className="self-start mt-3 px-0 h-auto text-[#D6B77A] hover:text-[#B8964A]"
                    >
                      Read article →
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Article dialog */}
      <Dialog open={!!openSlug} onOpenChange={(o) => !o && setOpenSlug(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            {activeArticle && (
              <Badge variant="outline" className="border-[#D6B77A]/40 text-[#C88F91] text-xs w-fit">
                {activeArticle.category}
              </Badge>
            )}
            <DialogTitle className="font-serif text-2xl">
              {loadingArticle ? "Loading…" : activeArticle?.title ?? ""}
            </DialogTitle>
            <DialogDescription>
              {activeArticle?.summary ?? ""}
            </DialogDescription>
          </DialogHeader>
          {loadingArticle ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A] mr-2" /> Loading…
            </div>
          ) : activeArticle ? (
            <ScrollArea className="h-[28rem] pr-3">
              <article className="prose prose-sm max-w-none">
                {activeArticle.body.split("\n").map((para, i) => (
                  <p key={i} className="text-sm text-foreground/90 leading-relaxed mb-3">
                    {para}
                  </p>
                ))}
              </article>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <X className="mx-auto h-6 w-6 mb-2" />
              Could not load article.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
