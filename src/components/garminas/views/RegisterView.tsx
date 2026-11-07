"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Globe2,
  Heart,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useNav, useSession } from "@/lib/store";
import { GARMINAS_DISTRICTS } from "@/lib/garminas";

interface RegisterResult {
  ok: boolean;
  userId?: string;
  dev?: { otp: string; emailToken: string };
  message?: string;
  error?: string;
  issues?: { path: (string | number)[]; message: string }[];
}

function checkStrength(p: string) {
  return {
    length: p.length >= 10,
    upper: /[A-Z]/.test(p),
    lower: /[a-z]/.test(p),
    digit: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
}

export default function RegisterView() {
  const setView = useNav((s) => s.setView);
  const refresh = useSession((s) => s.refresh);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    message: string;
    otp: string;
    emailToken: string;
  } | null>(null);

  // Step 1 — Personal
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"Male" | "Female" | "Prefer not to say" | "">("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [connectionToGB, setConnectionToGB] = useState("");

  // Step 2 — Security
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 3 — Eligibility & consent
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [ismailiEligibilityConfirmed, setIsmailiEligibilityConfirmed] = useState(false);
  const [matrimonialOnlyConfirmed, setMatrimonialOnlyConfirmed] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);

  const strength = useMemo(() => checkStrength(password), [password]);
  const strengthScore = Object.values(strength).filter(Boolean).length;
  const strengthPct = (strengthScore / 5) * 100;
  const strengthLabel =
    strengthScore <= 1
      ? "Very weak"
      : strengthScore === 2
        ? "Weak"
        : strengthScore === 3
          ? "Fair"
          : strengthScore === 4
            ? "Strong"
            : "Excellent";

  const step1Valid =
    fullName.trim().length >= 2 &&
    !!dateOfBirth &&
    !!gender &&
    /.+@.+\..+/.test(email) &&
    mobile.trim().length >= 7 &&
    city.trim().length >= 2 &&
    connectionToGB.trim().length >= 2;

  const step2Valid =
    strength.length &&
    strength.upper &&
    strength.lower &&
    strength.digit &&
    strength.special &&
    password === confirm;

  const step3Valid =
    ageConfirmed &&
    ismailiEligibilityConfirmed &&
    matrimonialOnlyConfirmed &&
    privacyPolicyAccepted;

  function next() {
    if (step === 1 && !step1Valid) {
      toast.error("Please complete all required personal fields.");
      return;
    }
    if (step === 2 && !step2Valid) {
      if (password !== confirm) {
        toast.error("Passwords do not match.");
        return;
      }
      toast.error("Please meet all password strength requirements.");
      return;
    }
    setStep((s) => (s + 1) as 1 | 2 | 3);
  }
  function back() {
    setStep((s) => (s - 1) as 1 | 2 | 3);
  }

  async function handleSubmit() {
    if (!step3Valid) {
      toast.error("Please confirm all required declarations.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          dateOfBirth,
          gender,
          email,
          mobile,
          password,
          city,
          connectionToGB,
          ismailiEligibilityConfirmed,
          matrimonialOnlyConfirmed,
          privacyPolicyAccepted,
          ageConfirmed,
        }),
      });
      const data = (await res.json()) as RegisterResult;
      if (!res.ok || !data.ok) {
        if (data.issues && data.issues.length > 0) {
          data.issues.forEach((i) =>
            toast.error(`${i.path.join(".")}: ${i.message}`)
          );
        } else {
          toast.error(data.error ?? "Registration failed.");
        }
        setLoading(false);
        return;
      }
      toast.success("Account created. Verify your contact details to continue.");
      await refresh();
      if (data.dev?.otp && data.dev?.emailToken) {
        setSuccess({
          message: data.message ?? "Verify your email and phone to continue.",
          otp: data.dev.otp,
          emailToken: data.dev.emailToken,
        });
      } else {
        setView("verify");
      }
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-navy-gradient flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg text-ivory">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ring-gold bg-white/5">
                <CheckCircle2 className="h-7 w-7 text-[#D6B77A]" />
              </div>
              <CardTitle className="text-2xl font-serif text-gold-gradient">
                Account created
              </CardTitle>
              <CardDescription className="text-ivory/70">
                {success.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-[#D6B77A]/30 bg-[#D6B77A]/10 p-4">
                <p className="text-[10px] tracking-[0.25em] uppercase text-[#D6B77A] font-semibold mb-3">
                  Demo only — in production these would be sent by SMS / email
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-ivory/60 mb-1">Phone OTP</p>
                    <p className="font-mono text-lg tracking-wider text-ivory bg-white/5 rounded px-3 py-2 border border-[#D6B77A]/20">
                      {success.otp}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ivory/60 mb-1">Email verification token</p>
                    <p className="font-mono text-xs break-all text-ivory bg-white/5 rounded px-3 py-2 border border-[#D6B77A]/20">
                      {success.emailToken}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-ivory/60">
                In production, the OTP is sent only by SMS and the verification
                link is sent only by email. They are shown here purely to help
                you complete the flow in the sandbox.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button
                onClick={() => setView("verify")}
                className="w-full bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
              >
                Continue to verification <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                onClick={() => setView("dashboard")}
                className="text-sm text-ivory/70 hover:text-ivory underline-offset-4 hover:underline"
              >
                Skip and go to dashboard
              </button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-navy-gradient overflow-hidden py-12 px-4">
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#D6B77A]/10 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#C88F91]/10 blur-3xl animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white/5">
            <Heart className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <h1 className="font-serif text-3xl text-ivory">Create your account</h1>
          <p className="mt-1 text-sm text-ivory/70">
            A considered, dignified beginning to your matrimonial journey.
          </p>
        </div>

        {/* Notice */}
        <div className="mb-6 rounded-md border border-[#D6B77A]/30 bg-[#D6B77A]/10 p-4 text-sm text-ivory/90">
          <p className="flex gap-2">
            <Sparkles className="h-4 w-4 text-[#D6B77A] shrink-0 mt-0.5" />
            <span>
              GarMinas is exclusively intended for adult Ismailis connected to
              Gilgit-Baltistan and is dedicated solely to matrimonial purposes.
            </span>
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-ivory/70 mb-2">
            <span>Step {step} of 3</span>
            <span>{step === 1 ? "Personal" : step === 2 ? "Security" : "Eligibility"}</span>
          </div>
          <Progress value={(step / 3) * 100} className="bg-white/10 h-1.5" />
        </div>

        <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg text-ivory">
          <CardHeader>
            <CardTitle className="text-gold-gradient font-serif text-xl">
              {step === 1 && "Personal details"}
              {step === 2 && "Account security"}
              {step === 3 && "Eligibility & consent"}
            </CardTitle>
            <CardDescription className="text-ivory/70">
              {step === 1 && "Tell us who you are and how to reach you."}
              {step === 2 && "Choose a strong password that protects your account."}
              {step === 3 && "Confirm your eligibility and accept our policies."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="space-y-4"
              >
                {step === 1 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-ivory/90">Full name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/40" />
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your full name"
                          className="pl-9 bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dob" className="text-ivory/90">Date of birth *</Label>
                        <Input
                          id="dob"
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          className="bg-white/5 border-[#D6B77A]/30 text-ivory"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-ivory/90">Gender *</Label>
                        <Select value={gender} onValueChange={(v) => setGender(v as "Male" | "Female" | "Prefer not to say")}>
                          <SelectTrigger className="bg-white/5 border-[#D6B77A]/30 text-ivory w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-ivory/90">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/40" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="pl-9 bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile" className="text-ivory/90">Mobile number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/40" />
                        <Input
                          id="mobile"
                          type="tel"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="e.g. +92 300 1234567"
                          className="pl-9 bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-ivory/90">Current city *</Label>
                        <Input
                          id="city"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Karachi"
                          className="bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-ivory/90">District connection</Label>
                        <Select defaultValue="Gilgit">
                          <SelectTrigger className="bg-white/5 border-[#D6B77A]/30 text-ivory w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {GARMINAS_DISTRICTS.map((d) => (
                              <SelectItem key={d} value={d}>{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="connectionToGB" className="text-ivory/90">
                        Your connection to Gilgit-Baltistan *
                      </Label>
                      <div className="relative">
                        <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/40" />
                        <Input
                          id="connectionToGB"
                          value={connectionToGB}
                          onChange={(e) => setConnectionToGB(e.target.value)}
                          placeholder="e.g. Born in Hunza, family from Gilgit"
                          className="pl-9 bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                        />
                      </div>
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-ivory/90">Password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/40" />
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="At least 10 characters"
                          className="pl-9 bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm" className="text-ivory/90">Confirm password *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/40" />
                        <Input
                          id="confirm"
                          type="password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="Re-enter your password"
                          className="pl-9 bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                        />
                      </div>
                      {confirm.length > 0 && confirm !== password && (
                        <p className="text-xs text-[#D9534F]">Passwords do not match.</p>
                      )}
                    </div>

                    {/* Strength meter */}
                    <div className="rounded-md border border-[#D6B77A]/20 bg-white/5 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-ivory/70">Password strength</span>
                        <span className="text-xs text-[#D6B77A] font-medium">{strengthLabel}</span>
                      </div>
                      <Progress value={strengthPct} className="bg-white/10 h-1.5 mb-3" />
                      <ul className="grid grid-cols-1 gap-1.5 text-xs text-ivory/80">
                        <li className="flex items-center gap-2">
                          <Check className={`h-3 w-3 ${strength.length ? "text-[#D6B77A]" : "text-ivory/40"}`} />
                          At least 10 characters
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className={`h-3 w-3 ${strength.upper ? "text-[#D6B77A]" : "text-ivory/40"}`} />
                          At least one uppercase letter
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className={`h-3 w-3 ${strength.lower ? "text-[#D6B77A]" : "text-ivory/40"}`} />
                          At least one lowercase letter
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className={`h-3 w-3 ${strength.digit ? "text-[#D6B77A]" : "text-ivory/40"}`} />
                          At least one digit
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className={`h-3 w-3 ${strength.special ? "text-[#D6B77A]" : "text-ivory/40"}`} />
                          At least one special character
                        </li>
                      </ul>
                    </div>
                  </>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <ConsentRow
                      checked={ageConfirmed}
                      onChange={setAgeConfirmed}
                      label="I confirm that I am 18 years of age or older."
                    />
                    <ConsentRow
                      checked={ismailiEligibilityConfirmed}
                      onChange={setIsmailiEligibilityConfirmed}
                      label="I confirm that I am an Ismaili connected to Gilgit-Baltistan and am eligible to use this community matrimonial platform."
                    />
                    <ConsentRow
                      checked={matrimonialOnlyConfirmed}
                      onChange={setMatrimonialOnlyConfirmed}
                      label="I will use GarMinas solely for serious matrimonial purposes and not for casual dating, solicitation or commercial activity."
                      footer={
                        <button
                          type="button"
                          onClick={() => setView("legal-matrimonial")}
                          className="text-[#D6B77A] hover:underline"
                        >
                          Read the matrimonial-only policy
                        </button>
                      }
                    />
                    <ConsentRow
                      checked={privacyPolicyAccepted}
                      onChange={setPrivacyPolicyAccepted}
                      label="I have read and accept the GarMinas Privacy Policy."
                      footer={
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          <button onClick={() => setView("legal-privacy")} className="text-[#D6B77A] hover:underline">Privacy Policy</button>
                          <button onClick={() => setView("legal-terms")} className="text-[#D6B77A] hover:underline">Terms of Service</button>
                          <button onClick={() => setView("legal-community")} className="text-[#D6B77A] hover:underline">Community Standards</button>
                          <button onClick={() => setView("legal-conduct")} className="text-[#D6B77A] hover:underline">Conduct Policy</button>
                        </div>
                      }
                    />
                    <div className="rounded-md border border-[#D6B77A]/20 bg-white/5 p-4 text-xs text-ivory/70 flex gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#D6B77A] shrink-0" />
                      <span>
                        After registration, you'll verify your email and phone,
                        and an authorised reviewer will discreetly confirm
                        identity and community eligibility. Matchmaking unlocks
                        only after your profile is approved.
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
          <Separator className="bg-[#D6B77A]/20" />
          <CardFooter className="flex items-center justify-between gap-3 pt-4">
            {step > 1 ? (
              <Button
                variant="ghost"
                onClick={back}
                disabled={loading}
                className="text-ivory/80 hover:bg-white/5 hover:text-ivory"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <button
                onClick={() => setView("login")}
                className="text-sm text-ivory/70 hover:text-ivory underline-offset-4 hover:underline"
              >
                Sign in instead
              </button>
            )}
            {step < 3 ? (
              <Button
                onClick={next}
                className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {loading ? "Creating account…" : "Create account"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

function ConsentRow({
  checked,
  onChange,
  label,
  footer,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[#D6B77A]/20 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={checked}
          onCheckedChange={(v) => onChange(v === true)}
          className="mt-0.5 data-[state=checked]:bg-[#D6B77A] data-[state=checked]:text-[#111827] data-[state=checked]:border-[#D6B77A]"
        />
        <div className="flex-1">
          <p className="text-sm text-ivory/90">{label}</p>
          {footer && <div className="mt-2">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
