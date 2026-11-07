"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Clock,
  FileCheck2,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useNav, useSession } from "@/lib/store";
import { VERIFICATION_BADGES } from "@/lib/garminas";

interface VerificationState {
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  communityVerified: boolean;
  profileApproved: boolean;
  communityConsent: boolean;
  status: string;
}

interface MemberSession {
  userId: string;
  email: string;
  role: string;
  status: string;
  profileApproved: boolean;
  profileComplete: number;
  fullName?: string;
  profileId?: string;
  verification?: VerificationState | null;
}

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  phone: Phone,
  identity: FileCheck2,
  community: UserCheck,
  profileApproved: BadgeCheck,
};

export default function VerifyView() {
  const setView = useNav((s) => s.setView);
  const refresh = useSession((s) => s.refresh);
  const session = useSession((s) => s.session) as MemberSession | null;

  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [loading, setLoading] = useState(true);

  const [emailToken, setEmailToken] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [communityLoading, setCommunityLoading] = useState(false);

  async function loadVerification() {
    try {
      const res = await fetch("/api/verify", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setVerification(data?.verification ?? null);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVerification();
  }, []);

  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-lux-gradient flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-muted-foreground">Please sign in to access the verification centre.</p>
          <Button onClick={() => setView("login")} className="mt-4 bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]">
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-lux-gradient flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#D6B77A]" />
      </div>
    );
  }

  const v: VerificationState = verification ?? {
    emailVerified: session.verification?.emailVerified ?? false,
    phoneVerified: session.verification?.phoneVerified ?? false,
    identityVerified: session.verification?.identityVerified ?? false,
    communityVerified: session.verification?.communityVerified ?? false,
    profileApproved: session.verification?.profileApproved ?? session.profileApproved ?? false,
    communityConsent: false,
    status: "INITIATED",
  };

  async function verifyEmail() {
    if (!emailToken || emailToken.length < 10) {
      toast.error("Please paste the email verification token.");
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: emailToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Verification failed.");
        return;
      }
      toast.success("Email verified.");
      setEmailToken("");
      await loadVerification();
      await refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setEmailLoading(false);
    }
  }

  async function sendOtp() {
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not send OTP.");
        return;
      }
      if (data?.alreadyVerified) {
        toast.success("Your phone is already verified.");
        await loadVerification();
        return;
      }
      setOtpSent(true);
      if (data?.dev?.otp) setDevOtp(data.dev.otp);
      toast.success("OTP sent. Check your phone.");
    } catch {
      toast.error("Network error.");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otp || otp.length !== 6) {
      toast.error("Enter the 6-digit OTP.");
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Verification failed.");
        return;
      }
      toast.success("Phone verified.");
      setOtp("");
      setDevOtp(null);
      await loadVerification();
      await refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setPhoneLoading(false);
    }
  }

  async function submitIdentity() {
    setIdentityLoading(true);
    try {
      const res = await fetch("/api/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identityDocumentRef: "pending" }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error ?? "Submission failed.");
        return;
      }
      toast.success("Submitted for review.");
      await loadVerification();
      await refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setIdentityLoading(false);
    }
  }

  async function toggleCommunity(checked: boolean) {
    setCommunityLoading(true);
    try {
      const res = await fetch("/api/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityConsent: checked }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error ?? "Could not update consent.");
        return;
      }
      toast.success(checked ? "Consent recorded." : "Consent withdrawn.");
      await loadVerification();
      await refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setCommunityLoading(false);
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
        <div className="text-center mb-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <ShieldCheck className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Verification centre
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Complete your verification
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Matchmaking unlocks only after your profile is approved. Each badge
            below represents a layer of trust that protects you and the wider
            community.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Email */}
          <BadgeCard
            badgeKey="email"
            verified={v.emailVerified}
            title="Email Verified"
            description="Confirm ownership of your email address."
            icon={Mail}
          >
            {!v.emailVerified && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="emailToken">Email verification token</Label>
                  <Input
                    id="emailToken"
                    value={emailToken}
                    onChange={(e) => setEmailToken(e.target.value)}
                    placeholder="Paste the token sent to your email"
                    className="font-mono text-xs"
                  />
                </div>
                <Button onClick={verifyEmail} disabled={emailLoading} className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] w-full">
                  {emailLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!emailLoading && <KeyRound className="h-4 w-4" />}
                  Verify email
                </Button>
              </div>
            )}
          </BadgeCard>

          {/* Phone */}
          <BadgeCard
            badgeKey="phone"
            verified={v.phoneVerified}
            title="Phone Verified"
            description="Confirm your mobile number via OTP."
            icon={Phone}
          >
            {!v.phoneVerified && (
              <div className="space-y-3">
                {!otpSent ? (
                  <Button onClick={sendOtp} disabled={phoneLoading} className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] w-full">
                    {phoneLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send OTP
                  </Button>
                ) : (
                  <>
                    {devOtp && (
                      <p className="text-xs text-muted-foreground">
                        <span className="text-[#C88F91] font-semibold">DEMO: OTP </span>
                        <span className="font-mono bg-[#F3EEE2] px-2 py-0.5 rounded">{devOtp}</span>
                      </p>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="otp">Enter OTP</Label>
                      <Input
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit code"
                        className="font-mono tracking-widest"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={verifyOtp} disabled={phoneLoading} className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] flex-1">
                        {phoneLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Verify
                      </Button>
                      <Button variant="outline" onClick={sendOtp} disabled={phoneLoading} className="border-[#D6B77A]/40">
                        Resend
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </BadgeCard>

          {/* Identity */}
          <BadgeCard
            badgeKey="identity"
            verified={v.identityVerified}
            title="Identity Verified"
            description="An authorised reviewer reviews your identity documents."
            icon={FileCheck2}
          >
            {!v.identityVerified && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  In production, you would securely upload a government-issued
                  identity document to private, access-controlled storage. A
                  reviewer would then discreetly verify it.
                </p>
                <Button onClick={submitIdentity} disabled={identityLoading} className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] w-full">
                  {identityLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!identityLoading && <FileCheck2 className="h-4 w-4" />}
                  Submit identity for review
                </Button>
              </div>
            )}
          </BadgeCard>

          {/* Community */}
          <BadgeCard
            badgeKey="community"
            verified={v.communityVerified}
            title="Community Verified"
            description="An authorised reviewer discreetly verifies your Ismaili community eligibility through approved references."
            icon={UserCheck}
          >
            {!v.communityVerified && (
              <div className="space-y-3">
                <div className="rounded-md border border-[#D6B77A]/25 bg-[#F3EEE2]/60 p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={v.communityConsent}
                      onCheckedChange={(val) => toggleCommunity(val === true)}
                      disabled={communityLoading}
                      className="mt-0.5 data-[state=checked]:bg-[#D6B77A] data-[state=checked]:text-[#111827] data-[state=checked]:border-[#D6B77A]"
                    />
                    <p className="text-xs text-foreground/80">
                      I consent to an authorised reviewer discreetly verifying my
                      Ismaili community eligibility through approved references.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Religious identity is never inferred from a name, location,
                  profession or photograph.
                </p>
                {communityLoading && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#D6B77A]" />
                )}
              </div>
            )}
          </BadgeCard>

          {/* Profile approved — full-width banner */}
          <div className="md:col-span-2">
            <BadgeCard
              badgeKey="profileApproved"
              verified={v.profileApproved}
              title="Profile Approved"
              description="Your profile and photographs have passed moderation review by GarMinas administrators."
              icon={BadgeCheck}
            >
              {!v.profileApproved && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Once email, phone, identity and community verifications are
                    complete, an administrator will review and approve your
                    profile. You'll be notified when matchmaking unlocks.
                  </p>
                  <Button
                    onClick={() => setView("profile-edit")}
                    variant="outline"
                    className="border-[#D6B77A]/40 hover:bg-[#F3EEE2]"
                  >
                    <Sparkles className="h-4 w-4" /> Complete your profile
                  </Button>
                </div>
              )}
            </BadgeCard>
          </div>
        </div>

        {/* Status summary */}
        <div className="mt-8 rounded-md border border-[#D6B77A]/30 bg-white p-4 shadow-lux">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#C88F91]">Overall status</p>
              <p className="font-serif text-lg text-foreground mt-1">{v.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {VERIFICATION_BADGES.map((b) => {
                const verified =
                  b.key === "email"
                    ? v.emailVerified
                    : b.key === "phone"
                      ? v.phoneVerified
                      : b.key === "identity"
                        ? v.identityVerified
                        : b.key === "community"
                          ? v.communityVerified
                          : v.profileApproved;
                const Icon = BADGE_ICONS[b.key] ?? BadgeCheck;
                return (
                  <Badge
                    key={b.key}
                    variant={verified ? "default" : "outline"}
                    className={
                      verified
                        ? "bg-[#D6B77A] text-[#111827] border-transparent"
                        : "border-[#D6B77A]/40 text-muted-foreground"
                    }
                  >
                    <Icon className="h-3 w-3" />
                    {b.label}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function BadgeCard({
  badgeKey,
  verified,
  title,
  description,
  icon: Icon,
  children,
}: {
  badgeKey: string;
  verified: boolean;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}) {
  const badgeInfo = VERIFICATION_BADGES.find((b) => b.key === badgeKey);
  return (
    <Card
      className={`bg-white border-[#D6B77A]/30 shadow-lux ${
        verified ? "ring-1 ring-[#D6B77A]/30" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            verified
              ? "bg-[#D6B77A]/20 text-[#D6B77A]"
              : "bg-[#F3EEE2] text-muted-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="font-serif text-lg text-foreground">{title}</CardTitle>
            {verified ? (
              <Badge className="bg-[#D6B77A] text-[#111827] border-transparent gap-1">
                <BadgeCheck className="h-3 w-3" /> Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="border-[#D6B77A]/40 text-muted-foreground gap-1">
                <Clock className="h-3 w-3" /> Pending
              </Badge>
            )}
          </div>
          <CardDescription className="mt-1">
            {badgeInfo?.description ?? description}
          </CardDescription>
        </div>
      </CardHeader>
      {children && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}
