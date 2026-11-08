"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  FileCheck2,
  Loader2,
  ShieldCheck,
  Upload,
  X,
  Smartphone,
  Building2,
  Wallet,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES, BASE_PRICE_PKR } from "@/lib/countries";

type PaymentMethod = "EASYPAISA" | "JAZZCASH" | "SADAPAY" | "BANK_TRANSFER" | "CREDIT_CARD";

interface PaymentMethodInfo {
  id: PaymentMethod;
  label: string;
  icon: typeof CreditCard;
  accountName: string;
  accountNumber: string;
  instructions: string;
  color: string;
}

const PAYMENT_METHODS: PaymentMethodInfo[] = [
  {
    id: "EASYPAISA",
    label: "EasyPaisa",
    icon: Smartphone,
    accountName: "GarMinas Matrimonial",
    accountNumber: "0300-1234567",
    instructions: "Open EasyPaisa App → Send Money → Enter the number above → Send $18 USD → Take a screenshot of the confirmation.",
    color: "#00A651",
  },
  {
    id: "JAZZCASH",
    label: "JazzCash",
    icon: Wallet,
    accountName: "GarMinas Matrimonial",
    accountNumber: "0300-7654321",
    instructions: "Open JazzCash App → Send Money → Enter the number above → Send $18 USD → Take a screenshot of the confirmation.",
    color: "#ED1C24",
  },
  {
    id: "SADAPAY",
    label: "SadaPay",
    icon: Wallet,
    accountName: "GarMinas Matrimonial",
    accountNumber: "0345-9876543",
    instructions: "Open SadaPay App → Send → Enter the number above → Send $18 USD → Take a screenshot of the confirmation.",
    color: "#6C5CE7",
  },
  {
    id: "BANK_TRANSFER",
    label: "Bank Transfer",
    icon: Building2,
    accountName: "GarMinas Matrimonial Services",
    accountNumber: "PK36MEZN0001234567890",
    instructions: "Transfer $18 USD to the bank account above via your banking app or ATM. Save the transaction receipt.",
    color: "#2D3436",
  },
  {
    id: "CREDIT_CARD",
    label: "Credit / Debit Card",
    icon: CreditCard,
    accountName: "Online Payment Portal",
    accountNumber: "Secure payment link will be provided",
    instructions: "Contact support to receive a secure payment link for your credit/debit card. You will receive a receipt by email.",
    color: "#0984E3",
  },
];

interface SubscriptionInfo {
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionAmount: number;
  subscriptionStartsAt: string | null;
  subscriptionExpiresAt: string | null;
  accountType: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  method: string;
  transactionRef: string;
  status: string;
  createdAt: string;
  receiptPath?: string;
}

interface UploadResponse {
  ok: boolean;
  path?: string;
  error?: string;
}

interface ExchangeRatesResponse {
  base: string;
  basePrice: number;
  rates: Record<string, number>;
}

interface SessionResponse {
  session: {
    currency?: string;
    country?: string | null;
  } | null;
}

/**
 * Format a converted price in the given currency.
 * - PKR: "5,000 PKR"
 * - USD: "$18"
 * - GBP: "£14"
 */
function formatLocalPrice(amountPkr: number, currency: string, rate: number): string {
  if (currency === "PKR") {
    return `${amountPkr.toLocaleString("en-PK")} PKR`;
  }
  const country = COUNTRIES.find((c) => c.currency === currency);
  const symbol = country?.currencySymbol ?? "";
  const localAmount = Math.round(amountPkr * rate);
  return `${symbol}${localAmount.toLocaleString("en-US")}`;
}

export default function SubscriptionView() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("EASYPAISA");
  const [transactionRef, setTransactionRef] = useState("");
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Multicurrency state
  const [rates, setRates] = useState<Record<string, number>>({ PKR: 1, USD: 0.0036 });
  const [basePrice, setBasePrice] = useState<number>(BASE_PRICE_PKR);
  const [currency, setCurrency] = useState<string>("USD");
  const [ratesLoading, setRatesLoading] = useState(true);

  // Fetch subscription/payment status, exchange rates, and user session on mount.
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) {
        const data = await res.json();
        setSubInfo(data.subscription);
        setPayments(data.payments || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    let fetchedRates: Record<string, number> = {};
    (async () => {
      try {
        const [ratesRes, sessRes] = await Promise.all([
          fetch("/api/exchange-rates"),
          fetch("/api/auth/me"),
        ]);
        if (ratesRes.ok) {
          const data: ExchangeRatesResponse = await ratesRes.json();
          fetchedRates = data.rates || { PKR: 1 };
          setRates(fetchedRates);
          setBasePrice(data.basePrice ?? BASE_PRICE_PKR);
        }
        if (sessRes.ok) {
          const sessData: SessionResponse = await sessRes.json();
          const userCurrency = sessData.session?.currency || "USD";
          // Only adopt the user's currency if it is supported by the rates object.
          if (userCurrency && fetchedRates[userCurrency] !== undefined) {
            setCurrency(userCurrency);
          }
        }
      } catch {
        // ignore — keep defaults
      } finally {
        setRatesLoading(false);
      }
    })();
  }, [fetchStatus]);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPEG, PNG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "payment_receipt");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data: UploadResponse = await res.json();
      if (data.ok && data.path) {
        setReceiptPath(data.path);
        toast.success("Payment screenshot uploaded successfully.");
      } else {
        toast.error(data.error || "Upload failed.");
      }
    } catch {
      toast.error("Network error during upload.");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSubmit = async () => {
    if (!transactionRef.trim()) {
      toast.error("Please enter your transaction reference / ID.");
      return;
    }
    if (!receiptPath) {
      toast.error("Please upload a screenshot of your payment confirmation.");
      return;
    }
    setSubmitting(true);
    try {
      const rate = rates[currency] ?? 1;
      const amountLocal = Math.round(basePrice * rate);
      const res = await fetch("/api/subscription/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedMethod,
          transactionRef: transactionRef.trim(),
          receiptPath,
          currency,
          amountLocal,
          exchangeRate: rate,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Payment submitted for verification.");
        setSubmitted(true);
        setTransactionRef("");
        setReceiptPath(null);
        fetchStatus();
      } else {
        toast.error(data.error || "Failed to submit payment.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard.");
  };

  const isActive = subInfo?.subscriptionStatus === "ACTIVE";
  const isPending = subInfo?.subscriptionStatus === "PENDING";
  const currentMethod = PAYMENT_METHODS.find((m) => m.id === selectedMethod)!;

  // Derived multicurrency display values.
  const currentRate = rates[currency] ?? 1;
  const localPriceLabel = formatLocalPrice(basePrice, currency, currentRate);
  const basePriceLabel = `${basePrice.toLocaleString("en-PK")} PKR`;
  const supportedCurrencies = Object.keys(rates);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#D6B77A" }} />
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-navy-gradient overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#D6B77A]/10 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#C88F91]/10 blur-3xl animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative mx-auto max-w-3xl space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white/5">
            <CreditCard className="h-5 w-5" style={{ color: "#D6B77A" }} />
          </div>
          <h1 className="font-serif text-3xl text-ivory">Subscription</h1>
          <p className="mt-1 text-sm text-ivory/70">
            Activate your monthly subscription to contact members.
          </p>
        </div>

        {/* Active / Pending status banner */}
        {isActive && subInfo?.subscriptionExpiresAt && (
          <Card className="border-emerald-500/30 bg-emerald-500/10 backdrop-blur">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="font-serif text-sm text-ivory">Subscription Active</p>
                <p className="text-xs text-ivory/70">
                  Valid until{" "}
                  {new Date(subInfo.subscriptionExpiresAt).toLocaleDateString("en-PK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isPending && (
          <Card className="border-[#D6B77A]/30 bg-[#D6B77A]/10 backdrop-blur">
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="h-6 w-6" style={{ color: "#D6B77A" }} />
              <div>
                <p className="font-serif text-sm text-ivory">Payment Under Verification</p>
                <p className="text-xs text-ivory/70">
                  An administrator is reviewing your payment. You will be notified once
                  your subscription is activated.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing card */}
        <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg">
          <CardHeader>
            <CardTitle className="text-center font-serif text-2xl text-ivory">
              Monthly Subscription
            </CardTitle>
            <CardDescription className="text-center text-ivory/70">
              Browsing profiles is free. Contacting members requires an active subscription.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 text-center">
              <span
                className="font-serif text-5xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #E8D9B5, #D6B77A, #B8964A)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {ratesLoading ? "…" : localPriceLabel}
              </span>
              {currency !== "PKR" && (
                <p className="mt-1 text-xs text-ivory/50">
                  ({basePriceLabel})
                </p>
              )}
              <p className="mt-1 text-sm text-ivory/60">per month</p>
            </div>
            {/* Currency selector */}
            <div className="mb-6 flex flex-col items-center gap-2">
              <Label
                htmlFor="currency-select"
                className="text-xs uppercase tracking-wider text-ivory/60"
              >
                Display currency
              </Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger
                  id="currency-select"
                  className="w-48 bg-white/5 border-[#D6B77A]/30 text-ivory"
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {supportedCurrencies.map((cur) => {
                    const country = COUNTRIES.find((c) => c.currency === cur);
                    const label = country
                      ? `${cur} — ${country.name}`
                      : cur;
                    return (
                      <SelectItem key={cur} value={cur}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                "Profile verification",
                "Document review",
                "Matchmaking & discovery",
                "Send matrimonial proposals",
                "Private messaging",
                "Priority support",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-ivory/80">
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#D6B77A" }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment form — only show if not active */}
        {!isActive && !submitted && (
          <>
            {/* Step 1: Select payment method */}
            <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-ivory">
                  Step 1 — Choose a payment method
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-all ${
                          isSelected
                            ? "border-[#D6B77A] bg-[#D6B77A]/15"
                            : "border-white/10 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ background: `${method.color}25` }}
                        >
                          <Icon className="h-5 w-5" style={{ color: method.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ivory">{method.label}</p>
                          <p className="text-xs text-ivory/50">{method.accountNumber}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5" style={{ color: "#D6B77A" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Payment instructions */}
            <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-ivory">
                  Step 2 — Send {ratesLoading ? "…" : localPriceLabel}
                  {currency !== "PKR" && (
                    <span className="ml-1 text-sm font-normal text-ivory/50">
                      ({basePriceLabel})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Account details */}
                <div className="rounded-lg border border-[#D6B77A]/20 bg-white/5 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <currentMethod.icon
                      className="h-5 w-5"
                      style={{ color: currentMethod.color }}
                    />
                    <span className="font-serif text-sm text-ivory">
                      {currentMethod.label} — Account Details
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-ivory/50">
                          Account Name
                        </p>
                        <p className="text-sm text-ivory">{currentMethod.accountName}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2">
                      <div className="flex-1">
                        <p className="text-[10px] uppercase tracking-wider text-ivory/50">
                          Account Number
                        </p>
                        <p className="font-mono text-sm text-ivory">
                          {currentMethod.accountNumber}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(currentMethod.accountNumber)}
                        className="rounded-md p-2 hover:bg-white/10 transition-colors"
                        title="Copy"
                      >
                        <Copy className="h-4 w-4" style={{ color: "#D6B77A" }} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between rounded-md bg-[#D6B77A]/10 px-3 py-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-ivory/50">
                          Amount to Send
                        </p>
                        <p
                          className="font-serif text-lg font-bold"
                          style={{ color: "#D6B77A" }}
                        >
                          {ratesLoading ? "…" : localPriceLabel}
                        </p>
                        {currency !== "PKR" && (
                          <p className="text-[10px] text-ivory/50">
                            ({basePriceLabel})
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-xs leading-relaxed text-ivory/70">
                    <span className="font-medium text-ivory">Instructions: </span>
                    {currentMethod.instructions}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Upload screenshot + transaction reference */}
            <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg">
              <CardHeader>
                <CardTitle className="font-serif text-xl text-ivory">
                  Step 3 — Upload payment screenshot
                </CardTitle>
                <CardDescription className="text-ivory/70">
                  Take a screenshot of your payment confirmation and upload it here for
                  admin verification.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload zone */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                />
                {receiptPath ? (
                  <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <FileCheck2 className="h-6 w-6 text-emerald-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ivory">
                        Screenshot uploaded
                      </p>
                      <p className="text-xs text-ivory/50">{receiptPath.split("/").pop()}</p>
                    </div>
                    <img
                      src={receiptPath}
                      alt="Payment screenshot"
                      className="h-12 w-12 rounded-md object-cover"
                    />
                    <button
                      onClick={() => setReceiptPath(null)}
                      className="rounded-md p-2 hover:bg-white/10"
                    >
                      <X className="h-4 w-4 text-ivory/60" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#D6B77A]/30 bg-white/5 px-4 py-8 transition-colors hover:border-[#D6B77A]/50 hover:bg-white/10"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#D6B77A" }} />
                        <span className="text-sm text-ivory/70">Uploading…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-6 w-6" style={{ color: "#D6B77A" }} />
                        <span className="text-sm text-ivory">Click to upload screenshot</span>
                        <span className="text-xs text-ivory/50">
                          JPEG, PNG, or WebP — max 5 MB
                        </span>
                      </>
                    )}
                  </button>
                )}

                {/* Transaction reference */}
                <div className="space-y-2">
                  <Label className="text-ivory/90 text-sm">
                    Transaction Reference / ID
                  </Label>
                  <Input
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. EP-12345678 or TID-98765"
                    className="bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                  />
                  <p className="text-xs text-ivory/50">
                    Enter the transaction ID from your payment confirmation message/SMS.
                  </p>
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || uploading || !receiptPath || !transactionRef.trim()}
                  className="w-full"
                  style={{
                    background: "linear-gradient(135deg, #E8D9B5, #D6B77A, #B8964A)",
                    color: "#111827",
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Submit Payment for Verification
                    </>
                  )}
                </Button>

                <Alert className="border-[#D6B77A]/20 bg-white/5">
                  <AlertDescription className="text-xs text-ivory/70">
                    Your payment screenshot and transaction reference will be reviewed by
                    an administrator. Once verified, your subscription will be activated
                    within 24 hours and you will receive a notification. Your account is
                    not charged automatically — payment is verified manually for your
                    security.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </>
        )}

        {/* Submitted confirmation */}
        {submitted && !isActive && (
          <Card className="glass-dark border border-emerald-500/30 shadow-lux-lg">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h2 className="font-serif text-xl text-ivory">
                Payment Submitted for Verification
              </h2>
              <p className="mt-2 max-w-md mx-auto text-sm text-ivory/70">
                Thank you. Your payment of{" "}
                <span className="font-medium text-[#D6B77A]">{localPriceLabel}</span>
                {currency !== "PKR" && (
                  <span className="text-ivory/50"> ({basePriceLabel})</span>
                )}{" "}
                has been submitted. An administrator will review your screenshot and
                activate your subscription within 24 hours. You will receive a
                notification once it's active.
              </p>
              <Button
                variant="outline"
                className="mt-6 border-[#D6B77A]/30 text-ivory hover:bg-white/10"
                onClick={() => setSubmitted(false)}
              >
                Submit Another Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment history */}
        {payments.length > 0 && (
          <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg">
            <CardHeader>
              <CardTitle className="font-serif text-lg text-ivory">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-72 overflow-y-auto scrollbar-lux space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-ivory">
                        {p.method.replace(/_/g, " ")} — {p.transactionRef}
                      </p>
                      <p className="text-xs text-ivory/50">
                        {new Date(p.createdAt).toLocaleDateString("en-PK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.receiptPath && (
                        <img
                          src={p.receiptPath}
                          alt="Receipt"
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                          p.status === "VERIFIED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : p.status === "REJECTED"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-[#D6B77A]/20 text-[#D6B77A]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="bg-[#D6B77A]/20" />
        <div className="pb-8 text-center">
          <p className="text-xs text-ivory/40">
            For payment support, contact{" "}
            <span className="text-[#D6B77A]">support@garminas.com</span> or open a
            support ticket from the Help page.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
