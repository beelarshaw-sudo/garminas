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
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";

type PaymentMethod = "BANK_TRANSFER" | "EASYPAISA" | "JAZZCASH" | "OTHER";

const PAYMENT_METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "BANK_TRANSFER", label: "Bank Transfer", hint: "Transfer to GarMinas bank account" },
  { value: "EASYPAISA", label: "EasyPaisa", hint: "Mobile wallet transfer" },
  { value: "JAZZCASH", label: "JazzCash", hint: "Mobile wallet transfer" },
  { value: "OTHER", label: "Other", hint: "Alternate arranged method" },
];

const INCLUDED_FEATURES = [
  "Profile verification & document review",
  "Full matchmaking & discovery",
  "Send and receive proposals",
  "Private messaging with members",
];

const MONTHLY_PRICE_PKR = 5000;

interface SubscriptionInfo {
  subscriptionStatus: string; // NONE | PENDING | ACTIVE | EXPIRED | CANCELLED
  subscriptionPlan: string;
  subscriptionAmount: number;
  subscriptionStartsAt: string | null;
  subscriptionExpiresAt: string | null;
  accountType: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  plan: string;
  method: string;
  receiptPath: string | null;
  transactionRef: string | null;
  status: string; // PENDING | VERIFIED | REJECTED
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

interface SubscriptionStatusResponse {
  subscription: SubscriptionInfo;
  payments: PaymentRecord[];
}

const STATUS_LABEL: Record<string, string> = {
  NONE: "No active subscription",
  PENDING: "Payment under verification",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function SubscriptionView() {
  const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [transactionRef, setTransactionRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription/status", { cache: "no-store" });
      if (!res.ok) {
        if (res.status !== 401) toast.error("Could not load subscription status.");
        setStatus(null);
        return;
      }
      const data = (await res.json()) as SubscriptionStatusResponse;
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  function handleFileSelected(file: File | undefined) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Receipt must be a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Receipt is too large. Maximum size is 5 MB.");
      return;
    }
    setReceiptFile(file);
    setReceiptPath(null);
    const reader = new FileReader();
    reader.onload = () => setReceiptPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    void uploadReceipt(file);
  }

  async function uploadReceipt(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "payment_receipt");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not upload receipt.");
        setReceiptPath(null);
        return;
      }
      setReceiptPath(typeof data.path === "string" ? data.path : null);
      toast.success("Receipt uploaded.");
    } catch {
      toast.error("Network error while uploading receipt.");
      setReceiptPath(null);
    } finally {
      setUploading(false);
    }
  }

  function clearReceipt() {
    setReceiptFile(null);
    setReceiptPreview(null);
    setReceiptPath(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!method) {
      toast.error("Please select a payment method.");
      return;
    }
    if (transactionRef.trim().length < 3) {
      toast.error("Enter your transaction reference.");
      return;
    }
    if (!receiptPath) {
      toast.error("Please upload your payment receipt.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/subscription/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          transactionRef: transactionRef.trim(),
          receiptPath,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not submit payment.");
        setSubmitting(false);
        return;
      }
      toast.success("Payment submitted for verification.");
      setJustSubmitted(true);
      setMethod("");
      setTransactionRef("");
      clearReceipt();
      await loadStatus();
    } catch {
      toast.error("Network error while submitting payment.");
    } finally {
      setSubmitting(false);
    }
  }

  const sub = status?.subscription;
  const isActive = sub?.subscriptionStatus === "ACTIVE";
  const payments = status?.payments ?? [];

  return (
    <div className="bg-navy-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-4xl mx-auto px-4 py-10 md:py-14 space-y-6"
      >
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white/5">
            <CreditCard className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#D6B77A] mb-2">
            Membership
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#FAF7F0]">
            Subscription
          </h1>
          <p className="text-[#FAF7F0]/70 mt-2 max-w-2xl mx-auto">
            GarMinas is free to browse. An active monthly subscription unlocks
            contact, proposals, and private messaging with verified members.
          </p>
        </div>

        {/* Pricing card */}
        <Card
          className="border-0 shadow-lux-lg overflow-hidden"
          style={{ background: "linear-gradient(135deg, #E8D9B5 0%, #D6B77A 50%, #B8964A 100%)" }}
        >
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-xs tracking-[0.25em] uppercase text-[#111827]/70">
                  Monthly Subscription
                </p>
                <p className="font-serif text-4xl md:text-5xl text-[#111827] mt-1">
                  {MONTHLY_PRICE_PKR.toLocaleString()}{" "}
                  <span className="text-2xl">PKR</span>
                </p>
                <p className="text-sm text-[#111827]/70 mt-1">per month · cancel anytime</p>
              </div>
              <ul className="space-y-2 md:max-w-sm">
                {INCLUDED_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#111827]">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-[#111827]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Free-browsing note */}
        <Alert className="glass-dark border-[#D6B77A]/30 text-[#FAF7F0]">
          <ShieldCheck className="h-4 w-4 text-[#D6B77A]" />
          <AlertTitle className="text-[#FAF7F0]">Browsing is always free</AlertTitle>
          <AlertDescription className="text-[#FAF7F0]/70">
            Browsing profiles is free. Contacting members requires an active subscription.
          </AlertDescription>
        </Alert>

        {/* Conditional: ACTIVE → active card, else justSubmitted → success card, else form */}
        {isActive ? (
          <Card className="glass-dark border-[#D6B77A]/40 shadow-lux">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D6B77A]/15 ring-1 ring-[#D6B77A]/40">
                  <CheckCircle2 className="h-6 w-6 text-[#D6B77A]" />
                </div>
                <div>
                  <p className="font-serif text-xl text-[#FAF7F0]">Your subscription is active</p>
                  <p className="text-sm text-[#FAF7F0]/70 mt-1">
                    Thank you for being a GarMinas member. Your subscription
                    {sub?.subscriptionExpiresAt
                      ? ` expires on ${formatDate(sub.subscriptionExpiresAt)}.`
                      : " is active."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : justSubmitted ? (
          <Card className="glass-dark border-[#D6B77A]/40 shadow-lux">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#D6B77A]/15 ring-1 ring-[#D6B77A]/40">
                  <Clock className="h-6 w-6 text-[#D6B77A]" />
                </div>
                <div className="flex-1">
                  <p className="font-serif text-xl text-[#FAF7F0]">Payment submitted for verification</p>
                  <p className="text-sm text-[#FAF7F0]/70 mt-1">
                    An administrator will review your receipt and transaction
                    reference, then activate your subscription. This usually
                    takes a few hours.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setJustSubmitted(false)}
                  className="border-[#D6B77A]/40 text-[#FAF7F0] hover:bg-white/5"
                >
                  Submit another
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-dark border-[#D6B77A]/30 shadow-lux">
            <CardHeader>
              <CardTitle className="font-serif text-xl text-[#FAF7F0] flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#D6B77A]" /> Submit your payment
              </CardTitle>
              <CardDescription className="text-[#FAF7F0]/70">
                Pay {MONTHLY_PRICE_PKR.toLocaleString()} PKR through any of the
                methods below, then upload your receipt for verification.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitPayment} className="space-y-5">
                {/* Payment method */}
                <div className="space-y-2">
                  <Label htmlFor="method" className="text-[#FAF7F0]/80">
                    Payment method
                  </Label>
                  <Select
                    value={method}
                    onValueChange={(v) => setMethod(v as PaymentMethod)}
                  >
                    <SelectTrigger
                      id="method"
                      className="w-full border-[#D6B77A]/40 bg-white/5 text-[#FAF7F0] data-[placeholder]:text-[#FAF7F0]/50"
                    >
                      <SelectValue placeholder="Select a payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {method && (
                    <p className="text-xs text-[#FAF7F0]/50">
                      {PAYMENT_METHODS.find((m) => m.value === method)?.hint}
                    </p>
                  )}
                </div>

                {/* Transaction reference */}
                <div className="space-y-2">
                  <Label htmlFor="txn" className="text-[#FAF7F0]/80">
                    Transaction reference
                  </Label>
                  <Input
                    id="txn"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. TRN-1029384 or EasyPaisa ID"
                    className="border-[#D6B77A]/40 bg-white/5 text-[#FAF7F0] placeholder:text-[#FAF7F0]/40"
                  />
                </div>

                {/* Receipt upload */}
                <div className="space-y-2">
                  <Label className="text-[#FAF7F0]/80">Payment receipt</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => handleFileSelected(e.target.files?.[0])}
                  />
                  {!receiptFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-md border border-dashed border-[#D6B77A]/40 bg-white/5 px-4 py-8 text-center transition-colors hover:border-[#D6B77A]/70 hover:bg-white/10"
                    >
                      <Upload className="h-6 w-6 mx-auto text-[#D6B77A]" />
                      <p className="mt-2 text-sm text-[#FAF7F0]">
                        Click to upload your receipt
                      </p>
                      <p className="text-xs text-[#FAF7F0]/50 mt-1">
                        JPEG, PNG or WebP · up to 5 MB
                      </p>
                    </button>
                  ) : (
                    <div className="rounded-md border border-[#D6B77A]/40 bg-white/5 p-3">
                      <div className="flex items-center gap-3">
                        {receiptPreview ? (
                          <img
                            src={receiptPreview}
                            alt="Payment receipt preview"
                            className="h-16 w-16 rounded object-cover border border-[#D6B77A]/30"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded bg-white/10">
                            <FileCheck2 className="h-6 w-6 text-[#D6B77A]" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-[#FAF7F0] truncate">{receiptFile.name}</p>
                          <p className="text-xs text-[#FAF7F0]/50 mt-0.5">
                            {uploading
                              ? "Uploading…"
                              : receiptPath
                                ? "Uploaded — ready to submit"
                                : "Upload failed — try again"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {uploading && <Loader2 className="h-4 w-4 animate-spin text-[#D6B77A]" />}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={clearReceipt}
                            className="text-[#FAF7F0]/70 hover:bg-white/10 hover:text-[#FAF7F0]"
                            aria-label="Remove receipt"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting || uploading || !receiptPath}
                  className="w-full text-[#111827]"
                  style={{ background: "linear-gradient(135deg, #E8D9B5 0%, #D6B77A 50%, #B8964A 100%)" }}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Submit payment for verification
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Status + payment history */}
        <Card className="glass-dark border-[#D6B77A]/30 shadow-lux">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-[#FAF7F0]">
              Subscription status & history
            </CardTitle>
            <CardDescription className="text-[#FAF7F0]/70">
              Your current membership and recent payment records.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {loadingStatus ? (
              <div className="flex items-center justify-center py-8 text-[#FAF7F0]/70">
                <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A] mr-2" /> Loading…
              </div>
            ) : !sub ? (
              <p className="text-sm text-[#FAF7F0]/70 text-center py-6">
                Sign in to view your subscription status.
              </p>
            ) : (
              <>
                <div className="grid sm:grid-cols-3 gap-4">
                  <StatusTile
                    label="Status"
                    value={STATUS_LABEL[sub.subscriptionStatus] ?? sub.subscriptionStatus}
                    tone={isActive ? "active" : "muted"}
                  />
                  <StatusTile
                    label="Plan"
                    value={sub.subscriptionPlan === "MONTHLY" ? "Monthly" : sub.subscriptionPlan}
                  />
                  <StatusTile
                    label="Expires"
                    value={formatDate(sub.subscriptionExpiresAt)}
                  />
                </div>

                <Separator className="bg-[#D6B77A]/20" />

                <div>
                  <p className="text-xs uppercase tracking-wider text-[#FAF7F0]/50 mb-3">
                    Payment history
                  </p>
                  {payments.length === 0 ? (
                    <p className="text-sm text-[#FAF7F0]/60 text-center py-6">
                      No payments yet. Submit your first payment above.
                    </p>
                  ) : (
                    <ul className="space-y-2 max-h-72 overflow-y-auto scrollbar-lux pr-1">
                      {payments.map((p) => (
                        <li
                          key={p.id}
                          className="rounded-md border border-[#D6B77A]/20 bg-white/5 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm text-[#FAF7F0]">
                                {p.amount.toLocaleString()} PKR ·{" "}
                                {PAYMENT_METHODS.find((m) => m.value === p.method)?.label ??
                                  p.method}
                              </p>
                              {p.transactionRef && (
                                <p className="text-xs text-[#FAF7F0]/50 mt-0.5 truncate">
                                  Ref: {p.transactionRef}
                                </p>
                              )}
                              <p className="text-xs text-[#FAF7F0]/50 mt-0.5">
                                {formatDate(p.createdAt)}
                              </p>
                            </div>
                            <PaymentStatusBadge status={p.status} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function StatusTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "active" | "muted";
}) {
  return (
    <div className="rounded-md border border-[#D6B77A]/20 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-wider text-[#FAF7F0]/50">{label}</p>
      <p
        className={`font-serif text-lg mt-1 ${
          tone === "active" ? "text-[#D6B77A]" : "text-[#FAF7F0]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING: {
      label: "Pending",
      className: "border-[#D6B77A]/40 text-[#D6B77A] bg-[#D6B77A]/10",
    },
    VERIFIED: {
      label: "Verified",
      className: "border-emerald-400/40 text-emerald-300 bg-emerald-400/10",
    },
    REJECTED: {
      label: "Rejected",
      className: "border-rose-400/40 text-rose-300 bg-rose-400/10",
    },
  };
  const cfg = map[status] ?? {
    label: status,
    className: "border-[#D6B77A]/40 text-[#FAF7F0]/70 bg-white/5",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
