"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Ban,
  Bookmark,
  Briefcase,
  Building2,
  Check,
  Flag,
  GraduationCap,
  Handshake,
  Heart,
  Languages,
  Loader2,
  Lock,
  MapPin,
  Sparkles,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  DEMO_PROFILES,
  REPORT_REASONS,
  VERIFICATION_BADGES,
  type DemoProfile,
  type MatchCardData,
} from "@/lib/garminas";
import { useNav, useSession } from "@/lib/store";

interface DiscoverMatch extends MatchCardData {
  isDemo?: boolean;
}

type ProfileDetail = DiscoverMatch & {
  heightCm?: number;
  connectionToGB?: string;
  qualitiesValued?: string;
  languages?: string[];
  preferences?: DemoProfile["preferences"];
  familyIntro?: string;
  familyInfoVisible?: boolean;
  employmentStatus?: string;
};

interface DiscoverResponse {
  matches: DiscoverMatch[];
  note?: string;
}

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: ShieldCheck,
  phone: ShieldCheck,
  identity: ShieldCheck,
  community: ShieldCheck,
  profileApproved: Check,
};

export default function ProfileDetailView() {
  const { selectedProfileId, setView } = useNav();
  const session = useSession((s) => s.session);

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  // dialog states
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestMsg, setInterestMsg] = useState("");
  const [sendingInterest, setSendingInterest] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [sendingIntro, setSendingIntro] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (!selectedProfileId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/discover/list", { cache: "no-store" });
        if (!res.ok) {
          toast.error("Could not load this profile.");
          return;
        }
        const data = (await res.json()) as DiscoverResponse;
        const match = data.matches.find((m) => m.profileId === selectedProfileId);
        if (cancelled) return;
        if (!match) {
          setProfile(null);
          return;
        }
        // Enrich with full demo profile fields if available
        const demo = DEMO_PROFILES.find((d) => d.id === match.profileId);
        const enriched: ProfileDetail = demo
          ? {
              ...match,
              heightCm: demo.heightCm,
              connectionToGB: demo.connectionToGB,
              qualitiesValued: demo.qualitiesValued,
              languages: demo.languages,
              preferences: demo.preferences,
              familyIntro: demo.familyIntro,
              familyInfoVisible: true,
            }
          : { ...match, familyInfoVisible: false };
        setProfile(enriched);
      } catch {
        if (!cancelled) toast.error("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedProfileId]);

  const profileApproved = !!(session as { profileApproved?: boolean } | null)?.profileApproved;

  const verifiedBadges = useMemo(() => {
    if (!profile) return [];
    // badges from API are label strings; map back to VERIFICATION_BADGES entries
    return VERIFICATION_BADGES.filter((vb) => profile.badges.includes(vb.label));
  }, [profile]);

  if (loading) {
    return (
      <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-64 rounded-2xl mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-lux-gradient min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="font-serif text-xl text-foreground">Profile not found</p>
          <p className="text-sm text-muted-foreground mt-2">
            This profile may have been removed or is no longer available.
          </p>
          <Button
            onClick={() => setView("discover")}
            className="mt-4 bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to discover
          </Button>
        </div>
      </div>
    );
  }

  const initials = profile.fullName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function sendInterest(withIntroduction: boolean) {
    if (!profile) return;
    const setter = withIntroduction ? setSendingIntro : setSendingInterest;
    setter(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverProfileId: profile.profileId,
          message: (withIntroduction ? "" : interestMsg).trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; proposalId?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Could not send proposal.");
        setter(false);
        return;
      }
      if (withIntroduction && data.proposalId) {
        const r2 = await fetch(`/api/proposals/${data.proposalId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "request_introduction" }),
        });
        if (!r2.ok) {
          const d2 = (await r2.json()) as { error?: string };
          toast.error(d2?.error ?? "Proposal sent, but introduction could not be requested.");
          setter(false);
          return;
        }
      }
      toast.success(
        withIntroduction ? "Introduction requested." : "Your interest has been sent.",
        {
          description: "We'll notify you when there is a response.",
        }
      );
      setInterestOpen(false);
      setIntroOpen(false);
      setInterestMsg("");
    } catch {
      toast.error("Network error.");
    } finally {
      setter(false);
    }
  }

  async function submitReport() {
    if (!profile) return;
    setSendingReport(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectUserId: profile.userId,
          reason: reportReason,
          details: reportDetails.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Could not submit report.");
        setSendingReport(false);
        return;
      }
      toast.success("Report submitted.", {
        description: "Our moderation team will review it discreetly.",
      });
      setReportOpen(false);
      setReportDetails("");
    } catch {
      toast.error("Network error.");
    } finally {
      setSendingReport(false);
    }
  }

  async function submitBlock() {
    if (!profile) return;
    setBlocking(true);
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUserId: profile.userId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Could not block this member.");
        setBlocking(false);
        return;
      }
      toast.success("Member blocked.", {
        description: "They will no longer appear in your discovery.",
      });
      setBlockOpen(false);
      setView("discover");
    } catch {
      toast.error("Network error.");
    } finally {
      setBlocking(false);
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView("discover")}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to discover
        </Button>

        {/* Hero card */}
        <Card className="mb-6 bg-white border-[#D6B77A]/30 shadow-lux-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-navy-gradient px-6 py-8 md:px-10 md:py-10">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="relative shrink-0 mx-auto md:mx-0">
                  <div className="h-24 w-24 rounded-full ring-gold flex items-center justify-center bg-lux-gradient">
                    <span className="font-serif text-3xl text-[#111827]">{initials}</span>
                  </div>
                  {profile.isDemo && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#F3EEE2] border border-[#D6B77A]/30 text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-0.5">
                      Demo
                    </span>
                  )}
                </div>
                <div className="text-center md:text-left flex-1 min-w-0">
                  <h1 className="font-serif text-3xl md:text-4xl text-[#FAF7F0]">
                    {profile.fullName}
                  </h1>
                  <p className="text-[#E8D9B5]/80 mt-1">
                    {profile.age} yrs · {profile.gender}
                    {profile.heightCm ? ` · ${profile.heightCm} cm` : ""}
                  </p>
                  <p className="text-[#E8D9B5]/70 text-sm mt-2 flex items-center gap-1.5 justify-center md:justify-start">
                    <MapPin className="h-4 w-4" />
                    {profile.city}, {profile.district}
                  </p>
                  {profile.connectionToGB && (
                    <p className="text-[#D6B77A] text-xs mt-2 flex items-center gap-1.5 justify-center md:justify-start">
                      <Sparkles className="h-3.5 w-3.5" />
                      {profile.connectionToGB}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Verification badges row */}
            <div className="px-6 py-5 md:px-10 border-b border-[#D6B77A]/15 bg-[#FAF7F0]/40">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Verification
              </p>
              <div className="flex flex-wrap gap-2">
                {verifiedBadges.length === 0 ? (
                  <span className="text-sm text-muted-foreground italic">
                    No verification badges shared.
                  </span>
                ) : (
                  verifiedBadges.map((b) => {
                    const Icon = BADGE_ICONS[b.key] ?? ShieldCheck;
                    return (
                      <Badge
                        key={b.key}
                        className="bg-[#D6B77A]/12 text-[#111827] border border-[#D6B77A]/35 gap-1.5 py-1"
                      >
                        <Icon className="h-3.5 w-3.5 text-[#D6B77A]" />
                        {b.label}
                      </Badge>
                    );
                  })
                )}
              </div>
            </div>

            {/* Action bar */}
            <div className="px-6 py-5 md:px-10 flex flex-wrap gap-2">
              <Button
                onClick={() => setInterestOpen(true)}
                disabled={!profileApproved}
                className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
              >
                <Heart className="h-4 w-4" /> Express interest
              </Button>
              <Button
                onClick={() => setIntroOpen(true)}
                disabled={!profileApproved}
                variant="outline"
                className="border-[#D6B77A]/40 hover:bg-[#D6B77A]/10"
              >
                <Handshake className="h-4 w-4" /> Request introduction
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSaved((v) => !v);
                  toast.success(saved ? "Removed from saved" : "Profile saved", {
                    description: "You can revisit saved profiles from your dashboard.",
                  });
                }}
                className={saved ? "text-[#D6B77A]" : "text-muted-foreground"}
              >
                <Bookmark className={saved ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                {saved ? "Saved" : "Save"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setReportOpen(true)}
                className="text-[#C88F91] hover:bg-[#C88F91]/10"
              >
                <Flag className="h-4 w-4" /> Report
              </Button>
              <Button
                variant="ghost"
                onClick={() => setBlockOpen(true)}
                className="text-[#B23A48] hover:bg-[#B23A48]/10"
              >
                <Ban className="h-4 w-4" /> Block
              </Button>
            </div>
          </CardContent>
        </Card>

        {!profileApproved && (
          <Alert className="mb-6 border-[#C88F91]/30 bg-[#C88F91]/5">
            <Lock className="h-4 w-4 text-[#C88F91]" />
            <AlertDescription className="text-sm">
              You can view this profile, but proposals and introductions require an
              approved account.{" "}
              <button
                onClick={() => setView("verify")}
                className="underline text-[#C88F91] hover:text-[#9b5f61]"
              >
                Complete verification
              </button>
              .
            </AlertDescription>
          </Alert>
        )}

        {/* Detail sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal introduction */}
          <SectionCard icon={Sparkles} title="Personal introduction">
            <p className="text-sm text-foreground leading-relaxed">{profile.aboutMe}</p>
            {profile.qualitiesValued && (
              <div className="mt-4 pt-4 border-t border-[#D6B77A]/15">
                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                  Qualities valued
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.qualitiesValued}
                </p>
              </div>
            )}
          </SectionCard>

          {/* Education & profession */}
          <SectionCard icon={GraduationCap} title="Education & profession">
            <DetailRow icon={GraduationCap} label="Education" value={profile.education} />
            <DetailRow icon={Briefcase} label="Profession" value={profile.profession} />
            {profile.employmentStatus && (
              <DetailRow icon={Building2} label="Employment" value={profile.employmentStatus} />
            )}
          </SectionCard>

          {/* Family background */}
          <SectionCard icon={Users} title="Family background">
            {profile.familyInfoVisible && profile.familyIntro ? (
              <p className="text-sm text-foreground leading-relaxed">{profile.familyIntro}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Family information is private. It may become visible after a mutual
                introduction has been established.
              </p>
            )}
          </SectionCard>

          {/* Languages */}
          <SectionCard icon={Languages} title="Languages">
            {profile.languages && profile.languages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.languages.map((l) => (
                  <Badge
                    key={l}
                    className="bg-[#F3EEE2] text-[#6B6457] border border-[#D6B77A]/25"
                  >
                    {l}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Language information not shared.
              </p>
            )}
          </SectionCard>

          {/* Marriage preferences */}
          {profile.preferences && (
            <SectionCard icon={Heart} title="Marriage preferences" className="md:col-span-2">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                <DetailRow
                  label="Preferred age"
                  value={`${profile.preferences.preferredAgeMin} – ${profile.preferences.preferredAgeMax} yrs`}
                />
                <DetailRow label="Education preference" value={profile.preferences.educationPrefs} />
                <DetailRow label="Profession preference" value={profile.preferences.professionPrefs} />
                <DetailRow
                  label="Preferred locations"
                  value={profile.preferences.preferredLocation.join(", ")}
                />
              </div>
            </SectionCard>
          )}
        </div>

        {/* Privacy note */}
        <Alert className="mt-6 border-[#D6B77A]/25 bg-white/60">
          <ShieldCheck className="h-4 w-4 text-[#D6B77A]" />
          <AlertDescription className="text-sm text-muted-foreground">
            Sensitive information is shown according to the member&apos;s visibility
            permissions. Exact residential addresses and phone numbers are never
            displayed.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Express interest dialog */}
      <Dialog open={interestOpen} onOpenChange={setInterestOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Heart className="h-5 w-5 text-[#D6B77A]" />
              Express interest to {profile.fullName}
            </DialogTitle>
            <DialogDescription>
              Your proposal will be delivered respectfully. An optional message helps
              introduce your intention.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Write a brief, respectful message…"
            maxLength={500}
            rows={5}
            value={interestMsg}
            onChange={(e) => setInterestMsg(e.target.value)}
          />
          <p className="text-xs text-muted-foreground text-right">{interestMsg.length}/500</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterestOpen(false)}>Cancel</Button>
            <Button
              onClick={() => sendInterest(false)}
              disabled={sendingInterest}
              className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
            >
              {sendingInterest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
              Send proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request introduction dialog */}
      <Dialog open={introOpen} onOpenChange={setIntroOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Handshake className="h-5 w-5 text-[#D6B77A]" />
              Request a formal introduction
            </DialogTitle>
            <DialogDescription>
              A formal introduction signals to the member that you would like their
              family to be involved in the discussion. This begins a more structured,
              considered process — distinct from a casual expression of interest.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-[#F3EEE2]/60 border border-[#D6B77A]/20 p-4 text-sm text-muted-foreground space-y-2">
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              The member will be notified that an introduction has been requested.
            </p>
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              You can authorise a family representative to participate from the Family
              Involvement page.
            </p>
            <p className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              Contact details remain private until both parties choose to share them.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntroOpen(false)}>Cancel</Button>
            <Button
              onClick={() => sendInterest(true)}
              disabled={sendingIntro}
              className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
            >
              {sendingIntro ? <Loader2 className="h-4 w-4 animate-spin" /> : <Handshake className="h-4 w-4" />}
              Request introduction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl flex items-center gap-2">
              <Flag className="h-5 w-5 text-[#C88F91]" />
              Report {profile.fullName}
            </DialogTitle>
            <DialogDescription>
              Reports are reviewed discreetly by our moderation team. Your identity is
              not shared with the reported member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Details (optional)
              </Label>
              <Textarea
                placeholder="Add context that will help our reviewers…"
                maxLength={500}
                rows={4}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button
              onClick={submitReport}
              disabled={sendingReport}
              className="bg-[#C88F91] text-white hover:bg-[#b07a7c]"
            >
              {sendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block alert dialog */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Block {profile.fullName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This member will no longer appear in your discovery, and they will be
              unable to send you proposals or messages. You can undo this from the
              Privacy centre at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitBlock}
              disabled={blocking}
              className="bg-[#B23A48] text-white hover:bg-[#9a3240]"
            >
              {blocking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
              Block member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`bg-white border-[#D6B77A]/25 shadow-lux ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-base flex items-center gap-2 text-foreground">
          <Icon className="h-4 w-4 text-[#D6B77A]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {Icon && <Icon className="h-4 w-4 text-[#D6B77A] shrink-0 mt-0.5" />}
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
