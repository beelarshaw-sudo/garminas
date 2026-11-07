"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Heart,
  HelpCircle,
  LifeBuoy,
  Lock,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useNav, useSession } from "@/lib/store";
import { VERIFICATION_BADGES } from "@/lib/garminas";

interface MemberSession {
  userId: string;
  email: string;
  role: string;
  status: string;
  profileApproved: boolean;
  profileComplete: number;
  fullName?: string;
  profileId?: string;
  verification?: {
    emailVerified: boolean;
    phoneVerified: boolean;
    identityVerified: boolean;
    communityVerified: boolean;
    profileApproved: boolean;
  } | null;
}

interface Counts {
  proposals: number;
  received: number;
  messages: number;
  matches: number;
}

export default function DashboardView() {
  const setView = useNav((s) => s.setView);
  const refresh = useSession((s) => s.refresh);
  const session = useSession((s) => s.session) as MemberSession | null;

  const [counts, setCounts] = useState<Counts>({ proposals: 0, received: 0, messages: 0, matches: 0 });
  const [loadingCounts, setLoadingCounts] = useState(true);

  useEffect(() => {
    refresh();
    (async () => {
      try {
        const [pRes, nRes] = await Promise.all([
          fetch("/api/proposals", { cache: "no-store" }),
          fetch("/api/notifications", { cache: "no-store" }),
        ]);
        const next: Counts = { proposals: 0, received: 0, messages: 0, matches: 0 };
        if (pRes.ok) {
          const pd = await pRes.json();
          next.proposals = Array.isArray(pd?.sent) ? pd.sent.length : 0;
          next.received = Array.isArray(pd?.received) ? pd.received.length : 0;
        }
        if (nRes.ok) {
          const nd = await nRes.json();
          next.messages = nd?.unread ?? 0;
        }
        next.matches = 6; // demo matches always available
        setCounts(next);
      } catch {
        /* ignore */
      } finally {
        setLoadingCounts(false);
      }
    })();
  }, [refresh]);

  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-lux-gradient flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
          <Button onClick={() => setView("login")} className="mt-4 bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  const v = session.verification;
  const verifiedBadges = VERIFICATION_BADGES.filter((b) => {
    if (b.key === "email") return v?.emailVerified;
    if (b.key === "phone") return v?.phoneVerified;
    if (b.key === "identity") return v?.identityVerified;
    if (b.key === "community") return v?.communityVerified;
    if (b.key === "profileApproved") return v?.profileApproved ?? session.profileApproved;
    return false;
  });

  const completion = session.profileComplete ?? 0;

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-4 py-10 md:py-14"
      >
        {/* Welcome header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
              Member dashboard
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              Welcome back, <span className="text-gold-gradient">{session.fullName || "member"}</span>
            </h1>
            <p className="text-muted-foreground mt-2">
              {session.profileApproved
                ? "Your profile is approved. Discover meaningful introductions below."
                : "Welcome to GarMinas. Complete your verification to unlock matchmaking."}
            </p>
            {verifiedBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {verifiedBadges.map((b) => (
                  <Badge key={b.key} className="bg-[#D6B77A]/15 text-[#111827] border border-[#D6B77A]/40 gap-1">
                    <ShieldCheck className="h-3 w-3 text-[#D6B77A]" />
                    {b.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Card className="bg-white border-[#D6B77A]/30 shadow-lux w-full md:w-72">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Profile completion</span>
                <span className="text-sm font-serif text-foreground">{completion}%</span>
              </div>
              <Progress value={completion} className="bg-[#F3EEE2] h-2" />
              <Button
                variant="link"
                size="sm"
                onClick={() => setView("profile-edit")}
                className="px-0 mt-2 h-auto text-[#D6B77A] hover:text-[#B8964A]"
              >
                {completion < 100 ? "Complete your profile" : "Edit your profile"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Not approved banner */}
        {!session.profileApproved && (
          <Card className="mb-8 bg-white border-[#C88F91]/40 shadow-lux">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C88F91]/15 ring-1 ring-[#C88F91]/30">
                  <Lock className="h-5 w-5 text-[#C88F91]" />
                </div>
                <div>
                  <p className="font-serif text-lg text-foreground">Matchmaking unlocks after profile approval</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete verification — email, phone, identity and community —
                    and an administrator will review and approve your profile. Once
                    approved, you can discover members and send proposals.
                  </p>
                </div>
              </div>
              <Button onClick={() => setView("verify")} className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] shrink-0">
                <ShieldCheck className="h-4 w-4" /> Complete verification
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatCard
            label="Recommended matches"
            value={loadingCounts ? "—" : String(counts.matches)}
            icon={Heart}
            actionLabel="Discover"
            onAction={() => setView("discover")}
            accent="rose"
          />
          <StatCard
            label="New proposals"
            value={loadingCounts ? "—" : String(counts.received)}
            icon={Sparkles}
            actionLabel="View proposals"
            onAction={() => setView("proposals")}
          />
          <StatCard
            label="Received interests"
            value={loadingCounts ? "—" : String(counts.proposals)}
            icon={Users}
            actionLabel="Open"
            onAction={() => setView("proposals")}
          />
          <StatCard
            label="Unread messages"
            value={loadingCounts ? "—" : String(counts.messages)}
            icon={MessageCircle}
            actionLabel="Open messages"
            onAction={() => setView("messages")}
          />
        </div>

        {/* Quick links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickLink
            icon={UserCog}
            label="Edit profile"
            description="Update your details and photos."
            onClick={() => setView("profile-edit")}
          />
          <QuickLink
            icon={Lock}
            label="Privacy centre"
            description="Manage visibility, sessions and data."
            onClick={() => setView("privacy")}
          />
          <QuickLink
            icon={Users}
            label="Family involvement"
            description="Invite trusted family representatives."
            onClick={() => setView("family")}
          />
          <QuickLink
            icon={LifeBuoy}
            label="Help & support"
            description="FAQ and support tickets."
            onClick={() => setView("help")}
          />
          <QuickLink
            icon={ShieldCheck}
            label="Verification"
            description="Complete verification badges."
            onClick={() => setView("verify")}
          />
          <QuickLink
            icon={Bell}
            label="Notifications"
            description="Recent activity and updates."
            onClick={() => setView("notifications")}
          />
          <QuickLink
            icon={Mail}
            label="Safety centre"
            description="File a report or block a member."
            onClick={() => setView("safety")}
          />
          <QuickLink
            icon={HelpCircle}
            label="Guidance library"
            description="Read articles on respectful matchmaking."
            onClick={() => setView("guidance")}
          />
        </div>
      </motion.div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  actionLabel,
  onAction,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  actionLabel: string;
  onAction: () => void;
  accent?: "rose";
}) {
  return (
    <Card className="bg-white border-[#D6B77A]/30 shadow-lux hover:shadow-lux-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardDescription className="text-xs uppercase tracking-wider">{label}</CardDescription>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${
            accent === "rose" ? "bg-[#C88F91]/15 text-[#C88F91]" : "bg-[#D6B77A]/15 text-[#D6B77A]"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="font-serif text-3xl text-foreground">{value}</p>
        <Button
          variant="link"
          size="sm"
          onClick={onAction}
          className="px-0 mt-2 h-auto text-[#D6B77A] hover:text-[#B8964A]"
        >
          {actionLabel} →
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left group"
    >
      <Card className="bg-white border-[#D6B77A]/25 shadow-lux hover:border-[#D6B77A]/50 hover:shadow-lux-lg transition-all h-full">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EEE2] text-[#D6B77A] group-hover:bg-[#D6B77A] group-hover:text-[#111827] transition-colors">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
