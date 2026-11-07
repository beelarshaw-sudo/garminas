"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const FAQS = [
  {
    q: "Who is GarMinas for?",
    a: "GarMinas is an exclusive matrimonial platform for adult Ismailis connected to Gilgit-Baltistan, including those living across the diaspora. Every member confirms, at registration, that they are 18 or older, that they are part of the Ismaili community connected to Gilgit-Baltistan, and that they intend to use the platform solely for serious matrimonial purposes.",
  },
  {
    q: "Is GarMinas a dating app?",
    a: "No. GarMinas is dedicated solely to matrimonial purposes. It is not designed for casual dating, hookups, or commercial activity. Proposals move through a structured, respectful lifecycle that gives both individuals and their families space to consider the introduction seriously before any commitment is made.",
  },
  {
    q: "How does verification work?",
    a: "Every member completes multi-layered verification: email, phone (via OTP), identity (reviewed by an authorised reviewer), community eligibility (discreetly verified through approved references), and profile approval by administrators. Matchmaking unlocks only after your profile is approved. Religious identity is never inferred from a name, location, profession, or photograph.",
  },
  {
    q: "How do proposals work?",
    a: "When you find a member whose profile resonates, you can send a proposal with an optional message. The proposal moves through statuses — Sent, Delivered, Viewed, Accepted or Declined, Introduction Requested, Family Discussion, and Closed. Both members always retain control: you can withdraw a proposal at any time, and you are never required to share a reason for declining.",
  },
  {
    q: "Can family be involved?",
    a: "Yes — optionally and with controlled permissions. You can invite up to three trusted family representatives (such as a parent, guardian, or elder sibling) and grant them specific, limited permissions: viewing your profile, sending messages on your behalf, or requesting introductions. Family representatives never gain unrestricted access to private conversations, account credentials, or personal information, and you can revoke their access at any time.",
  },
  {
    q: "How is my privacy protected?",
    a: "GarMinas never sells member information and never uses member photographs for marketing or AI training without separate explicit consent. Sensitive matrimonial details are masked in notification previews by default. You control who can see your photographs, who can find you in search, whether your online status is visible, and whether family information appears on your profile. You can request a complete export of your data or permanently delete your account at any time through the Privacy Centre.",
  },
];

const CATEGORIES = ["Account", "Verification", "Proposals", "Privacy", "Other"] as const;

interface TicketResponse {
  id: string;
  body: string;
  responderRole?: string | null;
  createdAt: string;
}
interface Ticket {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  responses?: TicketResponse[];
}

export default function HelpView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Account");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/support", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject || !message) {
      toast.error("Please provide a subject and message.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not submit ticket.");
        setSubmitting(false);
        return;
      }
      toast.success("Support ticket submitted.");
      setSubject("");
      setMessage("");
      await load();
    } catch {
      toast.error("Network error.");
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-5xl mx-auto px-4 py-10 md:py-14 space-y-6"
      >
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <LifeBuoy className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Help & support
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            How can we help?
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Find answers to common questions, or submit a confidential support
            ticket and our team will respond.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* FAQ */}
          <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#D6B77A]" /> Frequently asked questions
              </CardTitle>
              <CardDescription>Quick answers to common questions.</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {FAQS.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border-[#D6B77A]/20">
                    <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
                      {f.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                      {f.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Submit form */}
          <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#D6B77A]" /> Submit a support ticket
              </CardTitle>
              <CardDescription>
                We aim to respond within 2 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as (typeof CATEGORIES)[number])}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 4000))}
                    placeholder="Describe your question or issue. Do not include passwords or sensitive documents."
                    className="min-h-32"
                    required
                  />
                  <p className="text-xs text-muted-foreground">{message.length} / 4000</p>
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Submit ticket
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tickets list */}
        <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Your tickets</CardTitle>
            <CardDescription>{tickets.length} total</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A] mr-2" /> Loading…
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-10">
                <MessageSquare className="mx-auto h-8 w-8 text-[#D6B77A]/50 mb-3" />
                <p className="font-serif text-lg text-foreground">No tickets yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  When you submit a ticket, it will appear here with responses
                  from our team.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {tickets.map((t) => {
                  const expanded = expandedId === t.id;
                  const responseCount = t.responses?.length ?? 0;
                  return (
                    <li key={t.id} className="rounded-md border border-[#D6B77A]/20 bg-[#F3EEE2]/40">
                      <button
                        onClick={() => setExpandedId(expanded ? null : t.id)}
                        className="w-full text-left p-4 flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-foreground text-sm">{t.subject}</p>
                            <Badge variant="outline" className={`capitalize border-[#D6B77A]/40 ${t.status === "open" ? "text-[#C88F91]" : "text-muted-foreground"}`}>
                              {t.status}
                            </Badge>
                            <Badge variant="outline" className="border-[#D6B77A]/30 text-muted-foreground text-xs">
                              {t.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Ticket <span className="font-mono">{t.id.slice(0, 12)}</span> ·{" "}
                            {new Date(t.createdAt).toLocaleDateString()}
                            {responseCount > 0 && ` · ${responseCount} response${responseCount > 1 ? "s" : ""}`}
                          </p>
                        </div>
                        {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </button>
                      {expanded && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="rounded-md border border-[#D6B77A]/20 bg-white p-3">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your message</p>
                            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{t.message}</p>
                          </div>
                          {t.responses && t.responses.length > 0 && (
                            <div className="space-y-2">
                              {t.responses.map((r) => (
                                <div key={r.id} className="rounded-md border border-[#D6B77A]/30 bg-[#D6B77A]/8 p-3">
                                  <p className="text-xs uppercase tracking-wider text-[#D6B77A] mb-1">
                                    {r.responderRole ?? "Support"} · {new Date(r.createdAt).toLocaleString()}
                                  </p>
                                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{r.body}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
