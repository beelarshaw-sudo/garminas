"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  Globe2,
  Heart,
  Home,
  IdCard,
  Info,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNav, useSession } from "@/lib/store";
import { COUNTRIES, type CountryInfo } from "@/lib/countries";

type AccountType = "INDIVIDUAL" | "PARENT" | "";
type Gender = "Male" | "Female" | "Prefer not to say" | "";
type DocType = "id_card_front" | "id_card_back" | "electricity_bill";

interface RegisterResult {
  ok: boolean;
  userId?: string;
  dev?: { otp: string; emailToken: string };
  message?: string;
  error?: string;
  issues?: { path: (string | number)[]; message: string }[];
}

interface UploadResponse {
  ok?: boolean;
  path?: string;
  type?: string;
  error?: string;
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

const TOTAL_STEPS = 4;

const STEP_LABELS = [
  "Account Type",
  "Personal Details",
  "Security & Documents",
  "Eligibility & Consent",
];

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Deduplicate the country list (the source list contains a duplicate
// United States entry) so the registration dropdowns render cleanly.
const UNIQUE_COUNTRIES: CountryInfo[] = Array.from(
  new Map(COUNTRIES.map((c) => [c.code, c])).values(),
);

interface DocUploadZoneProps {
  label: string;
  description: string;
  icon: ReactNode;
  uploading: boolean;
  preview: string;
  fileName: string;
  done: boolean;
  onFile: (file: File) => void;
}

function DocUploadZone({
  label,
  description,
  icon,
  uploading,
  preview,
  fileName,
  done,
  onFile,
}: DocUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <Label className="text-sm text-ivory/80 mb-1.5 block">{label}</Label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full items-stretch gap-3 rounded-lg border-2 border-dashed px-4 py-4 text-left transition-colors ${
          dragging
            ? "border-[#D6B77A] bg-[#D6B77A]/10"
            : done
              ? "border-[#D6B77A]/40 bg-white/[0.04]"
              : "border-[#D6B77A]/40 bg-white/[0.03] hover:border-[#D6B77A] hover:bg-white/[0.06]"
        }`}
      >
        {uploading ? (
          <div className="flex items-center gap-3 py-1">
            <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A]" />
            <div>
              <p className="text-sm text-ivory">Uploading…</p>
              <p className="text-xs text-ivory/50">Please wait a moment.</p>
            </div>
          </div>
        ) : done ? (
          <div className="flex w-full items-start gap-3">
            {preview && (
              <img
                src={preview}
                alt=""
                className="h-12 w-12 rounded border border-[#D6B77A]/30 object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                <span className="truncate text-sm text-ivory">{fileName}</span>
              </div>
              <span className="text-xs text-ivory/50">
                Uploaded — click to replace
              </span>
            </div>
          </div>
        ) : (
          <div className="flex w-full items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#D6B77A]/10 text-[#D6B77A]">
              {icon}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ivory">{label}</p>
              <p className="text-xs text-ivory/50">{description}</p>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

export default function RegisterView() {
  const setView = useNav((s) => s.setView);
  const refresh = useSession((s) => s.refresh);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    message: string;
    otp: string;
    emailToken: string;
  } | null>(null);

  // Step 1 — Account type
  const [accountType, setAccountType] = useState<AccountType>("");
  const [parentRelationship, setParentRelationship] = useState("");

  // Step 2 — Personal details
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [nationality, setNationality] = useState("");
  const [region, setRegion] = useState("");
  const [callingCode, setCallingCode] = useState("");

  // Step 3 — Security
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Step 3 — Document uploads
  const [idCardFrontPath, setIdCardFrontPath] = useState("");
  const [idCardBackPath, setIdCardBackPath] = useState("");
  const [electricityBillPath, setElectricityBillPath] = useState("");
  const [idCardFrontName, setIdCardFrontName] = useState("");
  const [idCardBackName, setIdCardBackName] = useState("");
  const [electricityBillName, setElectricityBillName] = useState("");
  const [idCardFrontPreview, setIdCardFrontPreview] = useState("");
  const [idCardBackPreview, setIdCardBackPreview] = useState("");
  const [electricityBillPreview, setElectricityBillPreview] = useState("");
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [uploadingBill, setUploadingBill] = useState(false);

  // Step 4 — Eligibility, consent, subscription
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [ismailiEligibilityConfirmed, setIsmailiEligibilityConfirmed] =
    useState(false);
  const [matrimonialOnlyConfirmed, setMatrimonialOnlyConfirmed] =
    useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [subscriptionAccepted, setSubscriptionAccepted] = useState(false);
  const [genuineIntentionsConfirmed, setGenuineIntentionsConfirmed] =
    useState(false);

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
    accountType !== "" &&
    (accountType === "INDIVIDUAL" ||
      (accountType === "PARENT" && parentRelationship !== ""));

  const step2Valid =
    fullName.trim().length >= 2 &&
    !!dateOfBirth &&
    !!gender &&
    /.+@.+\..+/.test(email) &&
    mobile.trim().length >= 7 &&
    city.trim().length >= 2 &&
    country.trim().length >= 2 &&
    nationality.trim().length >= 2 &&
    callingCode.trim().length >= 1;

  const step3Valid =
    password.length > 0 &&
    strength.length &&
    strength.upper &&
    strength.lower &&
    strength.digit &&
    strength.special &&
    password === confirm &&
    idCardFrontPath !== "" &&
    idCardBackPath !== "" &&
    electricityBillPath !== "";

  const step4Valid =
    ageConfirmed &&
    ismailiEligibilityConfirmed &&
    matrimonialOnlyConfirmed &&
    privacyPolicyAccepted &&
    subscriptionAccepted &&
    genuineIntentionsConfirmed;

  const progressPct = (step / TOTAL_STEPS) * 100;

  // When the user selects a country of residence, auto-populate the
  // international calling code (e.g. Pakistan → +92).
  function handleCountryChange(code: string) {
    setCountry(code);
    const info = UNIQUE_COUNTRIES.find((c) => c.code === code);
    if (info) setCallingCode(info.callingCode);
  }

  // Reusable upload helper — posts multipart/form-data to /api/upload
  // and returns the stored file path.
  async function uploadFile(
    file: File,
    type: DocType,
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json()) as UploadResponse;
    if (!res.ok || !data.ok || !data.path) {
      throw new Error(data.error ?? "Upload failed.");
    }
    return data.path;
  }

  function pickState(type: DocType) {
    switch (type) {
      case "id_card_front":
        return {
          setUploading: setUploadingFront,
          setPath: setIdCardFrontPath,
          setName: setIdCardFrontName,
          setPreview: setIdCardFrontPreview,
        };
      case "id_card_back":
        return {
          setUploading: setUploadingBack,
          setPath: setIdCardBackPath,
          setName: setIdCardBackName,
          setPreview: setIdCardBackPreview,
        };
      case "electricity_bill":
        return {
          setUploading: setUploadingBill,
          setPath: setElectricityBillPath,
          setName: setElectricityBillName,
          setPreview: setElectricityBillPreview,
        };
    }
  }

  async function handleDocSelect(file: File, type: DocType) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5 MB.");
      return;
    }
    const { setUploading, setPath, setName, setPreview } = pickState(type);
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const path = await uploadFile(file, type);
      setPath(path);
      setName(file.name);
      toast.success("Document uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
      setPath("");
      setName("");
      setPreview("");
    } finally {
      setUploading(false);
    }
  }

  function next() {
    if (step === 1 && !step1Valid) {
      toast.error(
        accountType === "PARENT" && !parentRelationship
          ? "Please select your relationship to the person you're registering."
          : "Please choose an account type to continue.",
      );
      return;
    }
    if (step === 2 && !step2Valid) {
      toast.error("Please complete all required personal fields.");
      return;
    }
    if (step === 3 && !step3Valid) {
      if (password !== confirm) {
        toast.error("Passwords do not match.");
        return;
      }
      if (!idCardFrontPath || !idCardBackPath || !electricityBillPath) {
        toast.error("All three documents are compulsory for verification.");
        return;
      }
      toast.error("Please meet all password strength requirements.");
      return;
    }
    setStep((s) => (Math.min(s + 1, TOTAL_STEPS) as 1 | 2 | 3 | 4));
  }

  function back() {
    setStep((s) => (Math.max(s - 1, 1) as 1 | 2 | 3 | 4));
  }

  async function handleSubmit() {
    if (!step4Valid) {
      toast.error("Please confirm all declarations and the subscription.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: accountType === "PARENT" ? "PARENT" : "INDIVIDUAL",
          parentRelationship:
            accountType === "PARENT" ? parentRelationship : undefined,
          fullName,
          dateOfBirth,
          gender,
          email,
          mobile,
          callingCode,
          password,
          city,
          country,
          nationality,
          region,
          idCardFrontPath,
          idCardBackPath,
          electricityBillPath,
          ismailiEligibilityConfirmed,
          matrimonialOnlyConfirmed,
          privacyPolicyAccepted,
          ageConfirmed,
          subscriptionAccepted,
          genuineIntentionsConfirmed,
        }),
      });
      const data = (await res.json()) as RegisterResult;
      if (!res.ok || !data.ok) {
        if (data.issues && data.issues.length > 0) {
          data.issues.forEach((i) =>
            toast.error(`${i.path.join(".")}: ${i.message}`),
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
          message:
            data.message ?? "Verify your email and phone to continue.",
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
      <div className="bg-navy-gradient flex min-h-screen items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg text-ivory">
            <CardHeader className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 ring-gold">
                <CheckCircle2 className="h-7 w-7 text-[#D6B77A]" />
              </div>
              <CardTitle className="text-gold-gradient font-serif text-2xl">
                Account created
              </CardTitle>
              <CardDescription className="text-ivory/70">
                {success.message}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-[#D6B77A]/30 bg-[#D6B77A]/10 p-4">
                <p className="mb-3 text-[10px] font-semibold tracking-[0.25em] uppercase text-[#D6B77A]">
                  DEMO ONLY — in production these are sent by SMS / email
                </p>
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-xs text-ivory/60">Phone OTP</p>
                    <p className="rounded border border-[#D6B77A]/20 bg-white/5 px-3 py-2 font-mono text-lg tracking-wider text-ivory">
                      {success.otp}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-ivory/60">
                      Email verification token
                    </p>
                    <p className="rounded border border-[#D6B77A]/20 bg-white/5 px-3 py-2 break-all font-mono text-xs text-ivory">
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
              <div
                className="w-full rounded-lg border border-[#D6B77A]/30 bg-[#D6B77A]/10 p-3 text-center"
              >
                <p className="text-xs text-ivory/80">
                  After verification, you'll need to activate your{" "}
                  <span className="font-medium text-[#D6B77A]">
                    monthly subscription (5,000 PKR)
                  </span>{" "}
                  to browse profiles and contact members.
                </p>
              </div>
              <button
                onClick={() => setView("subscription")}
                className="text-sm text-ivory/70 underline-offset-4 hover:text-ivory hover:underline"
              >
                Go to subscription payment
              </button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-navy-gradient flex min-h-screen items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg text-ivory">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-2 text-[#D6B77A]">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-[0.25em] uppercase">
                GarMinas Registration
              </span>
            </div>
            <CardTitle className="text-gold-gradient font-serif text-2xl sm:text-3xl">
              Create your GarMinas account
            </CardTitle>
            <CardDescription className="text-ivory/70">
              A private, verified matrimonial platform for the global Ismaili
              community — connecting Ismailis worldwide.
            </CardDescription>

            {/* Step indicator + progress */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ivory/80">
                  Step{" "}
                  <span className="font-semibold text-ivory">{step}</span> of{" "}
                  {TOTAL_STEPS}
                </span>
                <span className="text-ivory/60">
                  {STEP_LABELS[step - 1]}
                </span>
              </div>
              <Progress
                value={progressPct}
                className="h-2 bg-white/10 [&>div]:bg-[#D6B77A]"
              />
              <div className="hidden grid-cols-4 gap-1 pt-1 sm:grid">
                {STEP_LABELS.map((label, i) => {
                  const n = i + 1;
                  const active = n === step;
                  const complete = n < step;
                  return (
                    <div
                      key={label}
                      className={`flex items-center gap-1.5 text-[11px] ${
                        active
                          ? "text-[#D6B77A]"
                          : complete
                            ? "text-ivory/70"
                            : "text-ivory/40"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border text-[9px] ${
                          active
                            ? "border-[#D6B77A] bg-[#D6B77A] text-[#111827]"
                            : complete
                              ? "border-[#D6B77A]/60 bg-[#D6B77A]/20 text-[#D6B77A]"
                              : "border-white/20"
                        }`}
                      >
                        {complete ? <Check className="h-2.5 w-2.5" /> : n}
                      </span>
                      <span className="hidden truncate lg:inline">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent className="min-h-[320px]">
            <AnimatePresence mode="wait">
              {/* ─────────────────────── STEP 1 ─────────────────────── */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <Alert className="border-[#D6B77A]/30 bg-[#D6B77A]/[0.07] text-ivory">
                    <Info className="text-[#D6B77A]" />
                    <AlertDescription className="text-ivory/80">
                      GarMinas is exclusively intended for adult Ismailis
                      worldwide and is dedicated solely to matrimonial
                      purposes.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label className="text-sm text-ivory/80">
                      Who are you registering?
                    </Label>
                    <RadioGroup
                      value={accountType}
                      onValueChange={(v) => setAccountType(v as AccountType)}
                      className="gap-3"
                    >
                      <label
                        htmlFor="acct-individual"
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                          accountType === "INDIVIDUAL"
                            ? "border-[#D6B77A] bg-[#D6B77A]/10"
                            : "border-white/15 bg-white/[0.03] hover:border-[#D6B77A]/50"
                        }`}
                      >
                        <RadioGroupItem
                          id="acct-individual"
                          value="INDIVIDUAL"
                          className="mt-0.5 border-white/40 text-[#D6B77A] data-[state=checked]:border-[#D6B77A] data-[state=checked]:text-[#D6B77A]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[#D6B77A]" />
                            <span className="text-sm font-medium text-ivory">
                              Individual
                            </span>
                          </div>
                          <p className="text-xs text-ivory/60">
                            I am searching for myself
                          </p>
                        </div>
                      </label>

                      <label
                        htmlFor="acct-parent"
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                          accountType === "PARENT"
                            ? "border-[#D6B77A] bg-[#D6B77A]/10"
                            : "border-white/15 bg-white/[0.03] hover:border-[#D6B77A]/50"
                        }`}
                      >
                        <RadioGroupItem
                          id="acct-parent"
                          value="PARENT"
                          className="mt-0.5 border-white/40 text-[#D6B77A] data-[state=checked]:border-[#D6B77A] data-[state=checked]:text-[#D6B77A]"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-[#D6B77A]" />
                            <span className="text-sm font-medium text-ivory">
                              Parent / Guardian
                            </span>
                          </div>
                          <p className="text-xs text-ivory/60">
                            I am searching for my child
                          </p>
                        </div>
                      </label>
                    </RadioGroup>
                  </div>

                  <AnimatePresence>
                    {accountType === "PARENT" && (
                      <motion.div
                        key="parent-relationship"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2">
                          <Label
                            htmlFor="parent-rel"
                            className="text-sm text-ivory/80"
                          >
                            Your relationship to the person you are registering
                          </Label>
                          <Select
                            value={parentRelationship}
                            onValueChange={setParentRelationship}
                          >
                            <SelectTrigger
                              id="parent-rel"
                              className="border-white/15 bg-white/[0.04] text-ivory focus:border-[#D6B77A]"
                            >
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Father">Father</SelectItem>
                              <SelectItem value="Mother">Mother</SelectItem>
                              <SelectItem value="Guardian">Guardian</SelectItem>
                              <SelectItem value="Elder Sibling">
                                Elder Sibling
                              </SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ─────────────────────── STEP 2 ─────────────────────── */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="fullName" className="text-sm text-ivory/80">
                      Full name
                    </Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#D6B77A]/70" />
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ali Karim"
                        className="border-white/15 bg-white/[0.04] pl-9 text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="dateOfBirth"
                      className="text-sm text-ivory/80"
                    >
                      Date of birth
                    </Label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#D6B77A]/70" />
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="border-white/15 bg-white/[0.04] pl-9 text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm text-ivory/80">
                      Gender
                    </Label>
                    <Select
                      value={gender}
                      onValueChange={(v) => setGender(v as Gender)}
                    >
                      <SelectTrigger
                        id="gender"
                        className="border-white/15 bg-white/[0.04] text-ivory focus:border-[#D6B77A]"
                      >
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Prefer not to say">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-ivory/80">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#D6B77A]/70" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="border-white/15 bg-white/[0.04] pl-9 text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A]"
                      />
                    </div>
                  </div>

                  {/* Country of residence — drives the calling code */}
                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm text-ivory/80">
                      Country of residence
                    </Label>
                    <Select
                      value={country}
                      onValueChange={handleCountryChange}
                    >
                      <SelectTrigger
                        id="country"
                        className="w-full border-white/15 bg-white/[0.04] text-ivory focus:border-[#D6B77A]"
                      >
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIQUE_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nationality */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="nationality"
                      className="text-sm text-ivory/80"
                    >
                      Nationality
                    </Label>
                    <Select
                      value={nationality}
                      onValueChange={setNationality}
                    >
                      <SelectTrigger
                        id="nationality"
                        className="w-full border-white/15 bg-white/[0.04] text-ivory focus:border-[#D6B77A]"
                      >
                        <SelectValue placeholder="Select nationality" />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIQUE_COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.flag} {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* State / Province / Region (optional) */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="region" className="text-sm text-ivory/80">
                      State / Province / Region{" "}
                      <span className="text-ivory/40">(optional)</span>
                    </Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#D6B77A]/70" />
                      <Input
                        id="region"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        placeholder="e.g. Sindh, Ontario, Dubai Emirate"
                        className="border-white/15 bg-white/[0.04] pl-9 text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A]"
                      />
                    </div>
                  </div>

                  {/* Current city */}
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm text-ivory/80">
                      Current city
                    </Label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#D6B77A]/70" />
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Karachi"
                        className="border-white/15 bg-white/[0.04] pl-9 text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A]"
                      />
                    </div>
                  </div>

                  {/* Mobile number with auto-populated calling code prefix */}
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm text-ivory/80">
                      Mobile number
                    </Label>
                    <div className="flex">
                      <div
                        className={`flex select-none items-center rounded-l-md border border-r-0 border-white/15 bg-white/[0.06] px-3 text-sm ${
                          callingCode ? "text-ivory" : "text-ivory/40"
                        }`}
                      >
                        {callingCode || "+__"}
                      </div>
                      <Input
                        id="mobile"
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="3XX XXXXXXX"
                        className="rounded-l-none border-white/15 bg-white/[0.04] text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A]"
                      />
                    </div>
                    <p className="text-xs text-ivory/50">
                      Calling code is set automatically from your country of
                      residence.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────── STEP 3 ─────────────────────── */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Password + strength */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#D6B77A]">
                      <Lock className="h-4 w-4" />
                      <span className="text-xs font-semibold tracking-[0.25em] uppercase">
                        Account security
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label
                          htmlFor="password"
                          className="text-sm text-ivory/80"
                        >
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a strong password"
                          className="border-white/15 bg-white/[0.04] text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="confirm"
                          className="text-sm text-ivory/80"
                        >
                          Confirm password
                        </Label>
                        <Input
                          id="confirm"
                          type="password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="Re-enter your password"
                          className={`border-white/15 bg-white/[0.04] text-ivory placeholder:text-ivory/40 focus:border-[#D6B77A] ${
                            confirm && confirm !== password
                              ? "border-red-400/60"
                              : ""
                          }`}
                        />
                      </div>
                    </div>

                    {password && (
                      <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-ivory/60">
                            Password strength
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              strengthScore >= 4
                                ? "text-green-400"
                                : strengthScore >= 3
                                  ? "text-[#D6B77A]"
                                  : "text-red-300"
                            }`}
                          >
                            {strengthLabel}
                          </span>
                        </div>
                        <Progress
                          value={strengthPct}
                          className="h-1.5 bg-white/10 [&>div]:bg-[#D6B77A]"
                        />
                        <ul className="grid grid-cols-1 gap-1 pt-1 sm:grid-cols-2">
                          {(
                            [
                              ["length", "At least 10 characters"],
                              ["upper", "One uppercase letter"],
                              ["lower", "One lowercase letter"],
                              ["digit", "One digit"],
                              ["special", "One special character"],
                            ] as const
                          ).map(([key, label]) => (
                            <li
                              key={key}
                              className="flex items-center gap-1.5 text-xs"
                            >
                              <span
                                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                                  strength[key]
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-white/10 text-ivory/40"
                                }`}
                              >
                                {strength[key] ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <span className="text-[10px]">·</span>
                                )}
                              </span>
                              <span
                                className={
                                  strength[key]
                                    ? "text-ivory/80"
                                    : "text-ivory/50"
                                }
                              >
                                {label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Document uploads */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#D6B77A]">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-xs font-semibold tracking-[0.25em] uppercase">
                        Compulsory documents
                      </span>
                    </div>

                    <DocUploadZone
                      label="Picture ID Card — Front side"
                      description="JPEG, PNG or WebP · max 5MB"
                      icon={<IdCard className="h-5 w-5" />}
                      uploading={uploadingFront}
                      preview={idCardFrontPreview}
                      fileName={idCardFrontName}
                      done={idCardFrontPath !== ""}
                      onFile={(f) => handleDocSelect(f, "id_card_front")}
                    />
                    <DocUploadZone
                      label="Picture ID Card — Back side"
                      description="JPEG, PNG or WebP · max 5MB"
                      icon={<IdCard className="h-5 w-5" />}
                      uploading={uploadingBack}
                      preview={idCardBackPreview}
                      fileName={idCardBackName}
                      done={idCardBackPath !== ""}
                      onFile={(f) => handleDocSelect(f, "id_card_back")}
                    />
                    <DocUploadZone
                      label="Latest Electricity Bill of your house"
                      description="JPEG, PNG or WebP · max 5MB"
                      icon={<Home className="h-5 w-5" />}
                      uploading={uploadingBill}
                      preview={electricityBillPreview}
                      fileName={electricityBillName}
                      done={electricityBillPath !== ""}
                      onFile={(f) => handleDocSelect(f, "electricity_bill")}
                    />

                    <Alert className="border-white/15 bg-white/[0.04] text-ivory">
                      <Lock className="text-[#D6B77A]" />
                      <AlertDescription className="text-ivory/70">
                        These documents are compulsory for verification. They
                        will be reviewed by an authorized administrator before
                        your profile is approved. Documents are stored securely
                        and never made public.
                      </AlertDescription>
                    </Alert>
                  </div>
                </motion.div>
              )}

              {/* ─────────────────────── STEP 4 ─────────────────────── */}
              {step === 4 && (
                <motion.div
                  key="step-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 text-[#D6B77A]">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-semibold tracking-[0.25em] uppercase">
                      Eligibility & consent
                    </span>
                  </div>

                  <div className="space-y-3">
                    {(
                      [
                        [
                          ageConfirmed,
                          setAgeConfirmed,
                          "I confirm I am 18 years or older",
                        ],
                        [
                          ismailiEligibilityConfirmed,
                          setIsmailiEligibilityConfirmed,
                          "I confirm my Ismaili community eligibility",
                        ],
                        [
                          matrimonialOnlyConfirmed,
                          setMatrimonialOnlyConfirmed,
                          "I understand this is a matrimonial-only platform",
                        ],
                        [
                          genuineIntentionsConfirmed,
                          setGenuineIntentionsConfirmed,
                          "I confirm that I am registering with genuine matrimonial intentions and that the information I provide is truthful and accurate.",
                        ],
                        [
                          privacyPolicyAccepted,
                          setPrivacyPolicyAccepted,
                          "I accept the Privacy Policy",
                        ],
                      ] as const
                    ).map(([value, setter, label]) => (
                      <label
                        key={label}
                        className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-[#D6B77A]/40"
                      >
                        <Checkbox
                          checked={value}
                          onCheckedChange={(v) => setter(v === true)}
                          className="mt-0.5 border-white/40 data-[state=checked]:border-[#D6B77A] data-[state=checked]:bg-[#D6B77A] data-[state=checked]:text-[#111827]"
                        />
                        <span className="text-sm text-ivory/90">{label}</span>
                      </label>
                    ))}
                  </div>

                  {/* Subscription notice */}
                  <div className="rounded-lg border-2 border-[#D6B77A]/60 bg-[#D6B77A]/[0.07] p-4">
                    <div className="flex items-center gap-2 text-[#D6B77A]">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        Monthly Subscription: 5,000 PKR
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-ivory/80">
                      GarMinas operates on a monthly subscription of 5,000
                      Pakistani Rupees. This covers profile verification,
                      document review, matchmaking, and private messaging. You
                      can browse profiles for free, but contacting members
                      requires an active subscription.
                    </p>
                    <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-md border border-[#D6B77A]/30 bg-white/[0.04] p-3 transition-colors hover:border-[#D6B77A]/60">
                      <Checkbox
                        checked={subscriptionAccepted}
                        onCheckedChange={(v) =>
                          setSubscriptionAccepted(v === true)
                        }
                        className="mt-0.5 border-[#D6B77A]/60 data-[state=checked]:border-[#D6B77A] data-[state=checked]:bg-[#D6B77A] data-[state=checked]:text-[#111827]"
                      />
                      <span className="text-sm text-ivory/90">
                        I acknowledge the monthly subscription fee of 5,000 PKR
                        and understand I will need to submit payment after my
                        documents are verified.
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full gap-2 sm:w-auto">
              {step > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={back}
                  disabled={loading}
                  className="text-ivory/70 hover:bg-white/5 hover:text-ivory"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setView("login")}
                className="order-2 text-center text-sm text-ivory/70 underline-offset-4 hover:text-ivory hover:underline sm:order-1"
              >
                Already have an account?{" "}
                <span className="text-[#D6B77A]">Sign in</span>
              </button>

              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={next}
                  className="order-1 w-full bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] sm:order-2 sm:w-auto"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="order-1 w-full bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] sm:order-2 sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Create Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
