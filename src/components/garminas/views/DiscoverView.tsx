"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Filter,
  Heart,
  Info,
  Loader2,
  Lock,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  EDUCATION_LEVELS,
  GARMINAS_DISTRICTS,
  MARITAL_STATUSES,
  PROFESSION_CATEGORIES,
  type MatchCardData,
} from "@/lib/garminas";
import { useNav, useSession } from "@/lib/store";

interface DiscoverMatch extends MatchCardData {
  isDemo?: boolean;
}

interface DiscoverResponse {
  matches: DiscoverMatch[];
  note?: string;
}

interface FilterState {
  ageMin: string;
  ageMax: string;
  district: string;
  education: string;
  profession: string;
  maritalStatus: string;
  q: string;
}

const EMPTY_FILTERS: FilterState = {
  ageMin: "",
  ageMax: "",
  district: "",
  education: "",
  profession: "",
  maritalStatus: "",
  q: "",
};

export default function DiscoverView() {
  const { setView, openProfile } = useNav();
  const session = useSession((s) => s.session);
  const refresh = useSession((s) => s.refresh);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<FilterState>(EMPTY_FILTERS);
  const [matches, setMatches] = useState<DiscoverMatch[]>([]);
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [interestTarget, setInterestTarget] = useState<DiscoverMatch | null>(null);
  const [interestMessage, setInterestMessage] = useState("");
  const [sendingInterest, setSendingInterest] = useState(false);
  const [sentProfileIds, setSentProfileIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (applied.ageMin) params.set("ageMin", applied.ageMin);
      if (applied.ageMax) params.set("ageMax", applied.ageMax);
      if (applied.district) params.set("district", applied.district);
      if (applied.education) params.set("education", applied.education);
      if (applied.profession) params.set("profession", applied.profession);
      if (applied.maritalStatus) params.set("maritalStatus", applied.maritalStatus);
      if (applied.q) params.set("q", applied.q);
      const res = await fetch(`/api/discover/list?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        toast.error("Could not load members.");
        setMatches([]);
        return;
      }
      const data = (await res.json()) as DiscoverResponse;
      setMatches(Array.isArray(data?.matches) ? data.matches : []);
      if (data?.note) setNote(data.note);
    } catch {
      toast.error("Network error.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [applied]);

  useEffect(() => {
    refresh();
    load();
  }, [refresh, load]);

  const profileApproved = !!(session as { profileApproved?: boolean } | null)?.profileApproved;

  function applyFilters() {
    setApplied(filters);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }

  async function sendInterest() {
    if (!interestTarget) return;
    setSendingInterest(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverProfileId: interestTarget.profileId,
          message: interestMessage.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; proposalId?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Could not send proposal.");
        setSendingInterest(false);
        return;
      }
      toast.success("Your interest has been sent.", {
        description: "We'll notify you when there is a response.",
      });
      setSentProfileIds((prev) => new Set(prev).add(interestTarget.profileId));
      setInterestTarget(null);
      setInterestMessage("");
    } catch {
      toast.error("Network error.");
    } finally {
      setSendingInterest(false);
    }
  }

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 py-10 md:py-14"
      >
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Matchmaking
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Discover <span className="text-gold-gradient">Members</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Browse respectfully curated matrimonial profiles, filtered to your
            preferences. Each introduction begins with dignity and proceeds at
            your pace.
          </p>
        </div>

        {/* Demo notice */}
        <Alert className="mb-6 border-[#D6B77A]/30 bg-white/70 backdrop-blur-sm shadow-lux">
          <Info className="h-4 w-4 text-[#D6B77A]" />
          <AlertTitle className="font-serif text-sm">A note on these results</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            {note ||
              "All results shown here are clearly-labelled demonstration profiles. In production, only verified, approved member profiles would appear."}
          </AlertDescription>
        </Alert>

        {/* Not approved banner */}
        {!profileApproved && !useSession.getState().loading && (
          <Card className="mb-6 bg-white border-[#C88F91]/40 shadow-lux">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C88F91]/15 ring-1 ring-[#C88F91]/30">
                  <Lock className="h-5 w-5 text-[#C88F91]" />
                </div>
                <div>
                  <p className="font-serif text-lg text-foreground">
                    Matchmaking is locked until profile approval
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete your verification so an administrator can approve your
                    profile. You can still preview how discovery will look below.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setView("verify")}
                className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] shrink-0"
              >
                <ShieldCheck className="h-4 w-4" /> Complete verification
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filter bar */}
        <Card className="mb-8 glass-lux shadow-lux border-[#D6B77A]/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-[#D6B77A]" />
              <p className="font-serif text-sm uppercase tracking-wider text-foreground">
                Refine your search
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ageMin" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Age (min)
                </Label>
                <Input
                  id="ageMin"
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={70}
                  placeholder="e.g. 24"
                  value={filters.ageMin}
                  onChange={(e) => setFilters({ ...filters, ageMin: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ageMax" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Age (max)
                </Label>
                <Input
                  id="ageMax"
                  type="number"
                  inputMode="numeric"
                  min={18}
                  max={70}
                  placeholder="e.g. 34"
                  value={filters.ageMax}
                  onChange={(e) => setFilters({ ...filters, ageMax: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">District</Label>
                <Select value={filters.district} onValueChange={(v) => setFilters({ ...filters, district: v })}>
                  <SelectTrigger className="w-full bg-white/60">
                    <SelectValue placeholder="Any district" />
                  </SelectTrigger>
                  <SelectContent>
                    {GARMINAS_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Education</Label>
                <Select value={filters.education} onValueChange={(v) => setFilters({ ...filters, education: v })}>
                  <SelectTrigger className="w-full bg-white/60">
                    <SelectValue placeholder="Any level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Profession</Label>
                <Select value={filters.profession} onValueChange={(v) => setFilters({ ...filters, profession: v })}>
                  <SelectTrigger className="w-full bg-white/60">
                    <SelectValue placeholder="Any field" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFESSION_CATEGORIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Marital status</Label>
                <Select value={filters.maritalStatus} onValueChange={(v) => setFilters({ ...filters, maritalStatus: v })}>
                  <SelectTrigger className="w-full bg-white/60">
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUSES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                <Label htmlFor="q" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Keyword
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="q"
                    placeholder="Name, city, profession…"
                    value={filters.q}
                    onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                    className="pl-9 bg-white/60"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilters();
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 mt-5">
              <Button variant="outline" onClick={resetFilters} className="border-[#D6B77A]/40">
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
              <Button onClick={applyFilters} className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]">
                <Filter className="h-4 w-4" /> Apply filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[28rem] rounded-2xl bg-white/60" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((m, idx) => (
              <motion.div
                key={m.profileId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut", delay: Math.min(idx * 0.05, 0.3) }}
              >
                <MatchCard
                  match={m}
                  onView={() => openProfile(m.profileId)}
                  onInterest={() => setInterestTarget(m)}
                  sent={sentProfileIds.has(m.profileId)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Express interest dialog */}
      <Dialog
        open={!!interestTarget}
        onOpenChange={(open) => {
          if (!open) {
            setInterestTarget(null);
            setInterestMessage("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#D6B77A]" />
              Express interest to {interestTarget?.fullName}
            </DialogTitle>
            <DialogDescription>
              Your proposal will be delivered respectfully. You may include an
              optional introductory message (max 500 characters).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Write a brief, respectful message introducing yourself and your intention…"
              maxLength={500}
              rows={5}
              value={interestMessage}
              onChange={(e) => setInterestMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground text-right">
              {interestMessage.length}/500
            </p>
          </div>
          {!profileApproved && (
            <Alert className="border-[#C88F91]/30 bg-[#C88F91]/5">
              <AlertCircle className="h-4 w-4 text-[#C88F91]" />
              <AlertDescription className="text-sm">
                Your profile is not yet approved. Proposals cannot be sent until an
                administrator approves your account.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setInterestTarget(null);
                setInterestMessage("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={sendInterest}
              disabled={sendingInterest || !profileApproved}
              className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
            >
              {sendingInterest ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
              Send proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchCard({
  match,
  onView,
  onInterest,
  sent,
}: {
  match: DiscoverMatch;
  onView: () => void;
  onInterest: () => void;
  sent: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const initials = useMemo(
    () =>
      match.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [match.fullName]
  );
  const compat = Math.max(0, Math.min(100, Math.round(match.compatibility ?? 0)));

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="relative h-full bg-white border-[#D6B77A]/25 shadow-lux hover:shadow-lux-lg transition-shadow overflow-hidden">
        {match.isDemo && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-[#F3EEE2] text-muted-foreground border border-[#D6B77A]/30 text-[10px] uppercase tracking-wider">
              Demo profile
            </Badge>
          </div>
        )}
        <CardContent className="p-6">
          {/* Header: avatar + identity */}
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <div className="h-16 w-16 rounded-full ring-gold flex items-center justify-center bg-lux-gradient">
                <span className="font-serif text-xl text-[#111827]">{initials}</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg text-foreground truncate pr-16">
                {match.fullName}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {match.age} yrs · {match.gender}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-[#C88F91]" />
                {match.city}, {match.district}
              </p>
            </div>
          </div>

          {/* Compatibility ring */}
          <div className="mt-5 flex items-center gap-4 rounded-xl bg-lux-gradient/60 border border-[#D6B77A]/20 p-4">
            <CompatibilityRing value={compat} />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Compatibility
              </p>
              <p className="font-serif text-2xl text-gold-gradient leading-tight">
                {compat}%
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Based on your stated preferences
              </p>
            </div>
          </div>

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5 mt-4">
            <Chip>{match.profession}</Chip>
            <Chip>{match.education}</Chip>
            <Chip variant="rose">{match.maritalStatus}</Chip>
          </div>

          {/* Badges */}
          {match.badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {match.badges.map((b) => (
                <Badge
                  key={b}
                  className="bg-[#D6B77A]/10 text-[#111827] border border-[#D6B77A]/30 text-[11px] gap-1"
                >
                  <ShieldCheck className="h-3 w-3 text-[#D6B77A]" />
                  {b}
                </Badge>
              ))}
            </div>
          )}

          {/* About */}
          {match.aboutMe && (
            <p className="text-sm text-muted-foreground mt-4 line-clamp-3 leading-relaxed">
              {match.aboutMe}
            </p>
          )}

          {/* Compatibility details */}
          {match.compatibilityFactors.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-[#D6B77A] hover:text-[#B8964A] transition-colors"
              >
                Compatibility details
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                />
              </button>
              {expanded && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.25 }}
                  className="mt-2 space-y-1.5"
                >
                  {match.compatibilityFactors.map((f) => (
                    <li key={f.label} className="flex items-center gap-2 text-xs">
                      {f.matched ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-[#C88F91]" />
                      )}
                      <span className={f.matched ? "text-foreground" : "text-muted-foreground"}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-5">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              className="flex-1 border-[#D6B77A]/40 hover:bg-[#D6B77A]/10"
            >
              <User className="h-4 w-4" /> View profile
            </Button>
            <Button
              size="sm"
              onClick={onInterest}
              disabled={sent}
              className="flex-1 bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
            >
              {sent ? (
                <>
                  <Check className="h-4 w-4" /> Sent
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Express interest
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CompatibilityRing({ value }: { value: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="#E5DCC8"
          strokeWidth="5"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D6B77A" />
            <stop offset="100%" stopColor="#B8964A" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-sm text-[#111827]">{value}</span>
      </div>
    </div>
  );
}

function Chip({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "rose";
}) {
  if (variant === "rose") {
    return (
      <span className="inline-flex items-center rounded-full bg-[#C88F91]/12 border border-[#C88F91]/30 text-[#9b5f61] text-[11px] px-2.5 py-0.5">
        {children}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-[#F3EEE2] border border-[#D6B77A]/25 text-[#6B6457] text-[11px] px-2.5 py-0.5">
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <Card className="bg-white border-[#D6B77A]/20 shadow-lux">
      <CardContent className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EEE2] ring-1 ring-[#D6B77A]/30">
          <Search className="h-6 w-6 text-[#D6B77A]" />
        </div>
        <p className="font-serif text-xl text-foreground">
          No members match your filters
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Try widening your preferences — relax the age range or remove a district
          filter to see more profiles.
        </p>
      </CardContent>
    </Card>
  );
}
