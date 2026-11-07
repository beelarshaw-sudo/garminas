"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  FileWarning,
  Loader2,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { REPORT_REASONS } from "@/lib/garminas";

interface ReportItem {
  id: string;
  subjectId: string;
  reason: string;
  details?: string | null;
  status: string;
  createdAt: string;
}

interface BlockItem {
  id: string;
  blockedId: string;
  createdAt: string;
}

export default function SafetyView() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [reportSubject, setReportSubject] = useState("");
  const [reportReason, setReportReason] = useState<(typeof REPORT_REASONS)[number] | "">("");
  const [reportDetails, setReportDetails] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const [blockUserId, setBlockUserId] = useState("");
  const [submittingBlock, setSubmittingBlock] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  async function load() {
    try {
      const [rRes, bRes] = await Promise.all([
        fetch("/api/reports", { cache: "no-store" }),
        fetch("/api/blocks", { cache: "no-store" }),
      ]);
      if (rRes.ok) {
        const d = await rRes.json();
        setReports(Array.isArray(d?.reports) ? d.reports : []);
      }
      if (bRes.ok) {
        const d = await bRes.json();
        setBlocks(Array.isArray(d?.blocks) ? d.blocks : []);
      }
    } catch {
      toast.error("Could not load safety data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!reportSubject || !reportReason) {
      toast.error("Please provide a subject user ID and a reason.");
      return;
    }
    setSubmittingReport(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectUserId: reportSubject,
          reason: reportReason,
          details: reportDetails || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not file report.");
        setSubmittingReport(false);
        return;
      }
      toast.success("Report filed. Our team will review it discreetly.");
      setReportSubject("");
      setReportReason("");
      setReportDetails("");
      await load();
    } catch {
      toast.error("Network error.");
      setSubmittingReport(false);
    }
  }

  async function submitBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!blockUserId) {
      toast.error("Enter a user ID to block.");
      return;
    }
    setSubmittingBlock(true);
    try {
      const res = await fetch("/api/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUserId: blockUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not block member.");
        setSubmittingBlock(false);
        return;
      }
      toast.success("Member blocked.");
      setBlockUserId("");
      await load();
    } catch {
      toast.error("Network error.");
      setSubmittingBlock(false);
    }
  }

  async function unblock(b: BlockItem) {
    setUnblockingId(b.blockedId);
    try {
      const res = await fetch(`/api/blocks?blockedUserId=${encodeURIComponent(b.blockedId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Could not unblock member.");
        return;
      }
      toast.success("Member unblocked.");
      await load();
    } catch {
      toast.error("Network error.");
    } finally {
      setUnblockingId(null);
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
            <ShieldCheck className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Safety & reporting
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            A community built on trust
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            GarMinas must never be used to solicit money, conduct scams, or
            harass other members. Use the tools below to protect yourself and
            the community.
          </p>
        </div>

        {/* Emergency note */}
        <div className="rounded-md border border-[#B23A48]/40 bg-[#B23A48]/8 p-4 text-sm text-foreground/90 flex gap-3">
          <Phone className="h-5 w-5 text-[#B23A48] shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">If you are in immediate danger</p>
            <p className="text-muted-foreground mt-1">
              Contact local emergency services. GarMinas is not an emergency
              service. If you encounter fraud, harassment, or any suspicious
              behaviour, file a confidential report below.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Report form */}
          <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-[#C88F91]" /> File a confidential report
              </CardTitle>
              <CardDescription>
                All reports are reviewed discreetly by our moderation team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitReport} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject user ID</Label>
                  <Input
                    id="subject"
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    placeholder="The user ID of the member you are reporting"
                  />
                  {blocks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-xs text-muted-foreground mr-1">From blocked:</span>
                      {blocks.slice(0, 3).map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setReportSubject(b.blockedId)}
                          className="text-xs text-[#D6B77A] hover:underline"
                        >
                          {b.blockedId.slice(0, 8)}…
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Select value={reportReason} onValueChange={(v) => setReportReason(v as (typeof REPORT_REASONS)[number])}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select a reason" /></SelectTrigger>
                    <SelectContent>
                      {REPORT_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="details">Details (optional)</Label>
                  <Textarea
                    id="details"
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value.slice(0, 2000))}
                    placeholder="Provide context that helps our team investigate. Do not include sensitive personal information."
                    className="min-h-24"
                  />
                  <p className="text-xs text-muted-foreground">{reportDetails.length} / 2000</p>
                </div>
                <Button type="submit" disabled={submittingReport} className="w-full bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]">
                  {submittingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
                  Submit report
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Block + Reports list */}
          <div className="space-y-6">
            {/* Quick block */}
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Ban className="h-4 w-4 text-[#C88F91]" /> Block a member
                </CardTitle>
                <CardDescription>
                  Blocked members cannot view your profile or send you proposals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitBlock} className="flex gap-2">
                  <Input
                    value={blockUserId}
                    onChange={(e) => setBlockUserId(e.target.value)}
                    placeholder="User ID"
                  />
                  <Button type="submit" disabled={submittingBlock} className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]">
                    {submittingBlock ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                    Block
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Filed reports */}
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Your filed reports</CardTitle>
                <CardDescription>{reports.length} total</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A] mr-2" /> Loading…
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    You have not filed any reports.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {reports.map((r) => (
                      <li key={r.id} className="rounded-md border border-[#D6B77A]/20 bg-[#F3EEE2]/40 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{r.reason}</p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              Against: <span className="font-mono">{r.subjectId.slice(0, 12)}…</span>
                            </p>
                            {r.details && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.details}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Filed {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline" className={`capitalize border-[#D6B77A]/40 ${r.status === "open" ? "text-[#C88F91]" : "text-muted-foreground"}`}>
                            {r.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Blocked members */}
        <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <UserX className="h-4 w-4 text-[#C88F91]" /> Blocked members
            </CardTitle>
            <CardDescription>{blocks.length} blocked</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A] mr-2" /> Loading…
              </div>
            ) : blocks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                You have not blocked any members.
              </p>
            ) : (
              <ul className="space-y-2">
                {blocks.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 rounded-md border border-[#D6B77A]/20 bg-[#F3EEE2]/40 p-3">
                    <div>
                      <p className="text-sm font-mono text-foreground">{b.blockedId}</p>
                      <p className="text-xs text-muted-foreground">
                        Blocked {new Date(b.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unblock(b)}
                      disabled={unblockingId === b.blockedId}
                      className="text-[#D6B77A] hover:bg-[#D6B77A]/10"
                    >
                      {unblockingId === b.blockedId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      Unblock
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Separator className="bg-[#D6B77A]/20" />
        <div className="rounded-md border border-[#C88F91]/30 bg-[#C88F91]/5 p-4 text-sm text-muted-foreground flex gap-2">
          <AlertTriangle className="h-4 w-4 text-[#C88F91] shrink-0 mt-0.5" />
          <span>
            Reports are confidential. We never reveal your identity to the
            member you report. Members found engaging in fraud, harassment or
            scam activity may be permanently banned.
          </span>
        </div>
      </motion.div>
    </div>
  );
}
