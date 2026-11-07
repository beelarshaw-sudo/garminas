"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock,
  Inbox,
  Loader2,
  MessageCircle,
  Sparkles,
  Users,
  X,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PROPOSAL_STATUS_LABELS } from "@/lib/garminas";
import { useNav } from "@/lib/store";

type ProposalStatus =
  | "SENT"
  | "DELIVERED"
  | "VIEWED"
  | "ACCEPTED"
  | "DECLINED"
  | "INTRODUCTION_REQUESTED"
  | "FAMILY_DISCUSSION"
  | "CLOSED";

interface StatusHistoryEntry {
  status: string;
  date: string;
}

interface Proposal {
  id: string;
  status: ProposalStatus;
  message?: string | null;
  counterpartyName: string;
  direction: "sent" | "received";
  createdAt: string;
  statusHistory: StatusHistoryEntry[];
  introductionRequested?: boolean;
  familyInvolved?: boolean;
}

interface ProposalsResponse {
  sent: Proposal[];
  received: Proposal[];
}

const ACTIVE_STATUSES: ProposalStatus[] = [
  "SENT",
  "DELIVERED",
  "VIEWED",
  "ACCEPTED",
  "INTRODUCTION_REQUESTED",
  "FAMILY_DISCUSSION",
];

function statusClass(status: ProposalStatus): string {
  switch (status) {
    case "SENT":
    case "DELIVERED":
      return "bg-[#D6B77A]/15 text-[#B8964A] border-[#D6B77A]/40";
    case "VIEWED":
      return "bg-muted text-muted-foreground border-border";
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "DECLINED":
      return "bg-[#C88F91]/15 text-[#9b5f61] border-[#C88F91]/40";
    case "INTRODUCTION_REQUESTED":
      return "bg-[#D6B77A]/10 text-[#5a6b8a] border-[#5a6b8a]/30";
    case "FAMILY_DISCUSSION":
      return "bg-[#8E7CC3]/10 text-[#6b5b9e] border-[#8E7CC3]/30";
    case "CLOSED":
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export default function ProposalsView() {
  const { openConversation } = useNav();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [data, setData] = useState<ProposalsResponse>({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);

  // action states
  const [declineTarget, setDeclineTarget] = useState<Proposal | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [declining, setDeclining] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<Proposal | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proposals", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not load proposals.");
        return;
      }
      const d = (await res.json()) as ProposalsResponse;
      setData({
        sent: Array.isArray(d?.sent) ? d.sent : [],
        received: Array.isArray(d?.received) ? d.received : [],
      });
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function actOnProposal(id: string, action: string, reason?: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/proposals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Action failed.");
        setActingId(null);
        return;
      }
      toast.success(`Proposal ${action.replace("_", " ")}.`);
      await load();
    } catch {
      toast.error("Network error.");
    } finally {
      setActingId(null);
    }
  }

  function openConv(proposal: Proposal) {
    // Conversation is created on accept; map by proposal id if present.
    void proposal;
    openConversation(proposal.id);
    toast.success("Opening conversation", {
      description: "If the thread is not yet available, it will appear in Messages shortly.",
    });
  }

  const list = tab === "received" ? data.received : data.sent;

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-4xl mx-auto px-4 py-10 md:py-14"
      >
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <Sparkles className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Matrimonial proposals
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Your <span className="text-gold-gradient">proposals</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Every proposal follows a respectful, considered process. Review,
            accept, or decline with care.
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "received" | "sent")}>
          <div className="flex justify-center mb-6">
            <TabsList className="bg-white border border-[#D6B77A]/25 shadow-lux">
              <TabsTrigger value="received" className="data-[state=active]:bg-[#D6B77A]/15 gap-1.5">
                <ArrowDownLeft className="h-4 w-4" />
                Received
                {data.received.length > 0 && (
                  <Badge className="ml-1 bg-[#D6B77A] text-[#111827] text-[10px] px-1.5 py-0">
                    {data.received.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="data-[state=active]:bg-[#D6B77A]/15 gap-1.5">
                <ArrowUpRight className="h-4 w-4" />
                Sent
                {data.sent.length > 0 && (
                  <Badge className="ml-1 bg-[#D6B77A] text-[#111827] text-[10px] px-1.5 py-0">
                    {data.sent.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="received">
            <ProposalList
              proposals={data.received}
              loading={loading}
              actingId={actingId}
              onAccept={(p) => actOnProposal(p.id, "accept")}
              onDecline={(p) => {
                setDeclineTarget(p);
                setDeclineReason("");
              }}
              onIntroduction={(p) => actOnProposal(p.id, "request_introduction")}
              onFamily={(p) => actOnProposal(p.id, "family_involve")}
              onClose={(p) => actOnProposal(p.id, "close")}
              onOpenConv={openConv}
              emptyTitle="No proposals received yet"
              emptyDescription="When a member expresses interest in your profile, it will appear here."
            />
          </TabsContent>

          <TabsContent value="sent">
            <ProposalList
              proposals={data.sent}
              loading={loading}
              actingId={actingId}
              isSent
              onWithdraw={(p) => {
                setWithdrawTarget(p);
                setWithdrawReason("");
              }}
              onFamily={(p) => actOnProposal(p.id, "family_involve")}
              onClose={(p) => actOnProposal(p.id, "close")}
              onOpenConv={openConv}
              emptyTitle="No proposals sent yet"
              emptyDescription="Discover members to send your first matrimonial proposal."
            />
          </TabsContent>
        </Tabs>

        <Alert className="mt-8 border-[#D6B77A]/25 bg-white/60">
          <Inbox className="h-4 w-4 text-[#D6B77A]" />
          <AlertDescription className="text-sm text-muted-foreground">
            Decline reasons are never disclosed unless the sender chooses to share them.
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Decline dialog */}
      <Dialog open={!!declineTarget} onOpenChange={(o) => !o && setDeclineTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Decline this proposal?</DialogTitle>
            <DialogDescription>
              You may add an optional note. It will not be shared with the sender unless
              you explicitly choose to share it later.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional note for your records…"
            maxLength={500}
            rows={4}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!declineTarget) return;
                setDeclining(true);
                await actOnProposal(declineTarget.id, "decline", declineReason);
                setDeclining(false);
                setDeclineTarget(null);
              }}
              disabled={declining}
              className="bg-[#C88F91] text-white hover:bg-[#b07a7c]"
            >
              {declining ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Decline proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw alert dialog */}
      <AlertDialog open={!!withdrawTarget} onOpenChange={(o) => !o && setWithdrawTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Withdraw this proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              Withdrawing ends this proposal. You may optionally share a reason with the
              recipient — sharing is your choice and is never required.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Optional reason to share with the recipient…"
            maxLength={500}
            rows={3}
            value={withdrawReason}
            onChange={(e) => setWithdrawReason(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep proposal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!withdrawTarget) return;
                setWithdrawing(true);
                await actOnProposal(withdrawTarget.id, "withdraw", withdrawReason);
                setWithdrawing(false);
                setWithdrawTarget(null);
              }}
              disabled={withdrawing}
              className="bg-[#B23A48] text-white hover:bg-[#9a3240]"
            >
              {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProposalList({
  proposals,
  loading,
  actingId,
  isSent,
  onAccept,
  onDecline,
  onIntroduction,
  onFamily,
  onClose,
  onWithdraw,
  onOpenConv,
  emptyTitle,
  emptyDescription,
}: {
  proposals: Proposal[];
  loading: boolean;
  actingId: string | null;
  isSent?: boolean;
  onAccept?: (p: Proposal) => void;
  onDecline?: (p: Proposal) => void;
  onIntroduction?: (p: Proposal) => void;
  onFamily?: (p: Proposal) => void;
  onClose?: (p: Proposal) => void;
  onWithdraw?: (p: Proposal) => void;
  onOpenConv?: (p: Proposal) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl bg-white/60" />
        ))}
      </div>
    );
  }
  if (proposals.length === 0) {
    return (
      <Card className="bg-white border-[#D6B77A]/20 shadow-lux">
        <CardContent className="py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EEE2] ring-1 ring-[#D6B77A]/30">
            <Inbox className="h-6 w-6 text-[#D6B77A]" />
          </div>
          <p className="font-serif text-xl text-foreground">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            {emptyDescription}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-5">
      {proposals.map((p, idx) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: Math.min(idx * 0.05, 0.25) }}
        >
          <ProposalCard
            proposal={p}
            actingId={actingId}
            isSent={isSent}
            onAccept={onAccept}
            onDecline={onDecline}
            onIntroduction={onIntroduction}
            onFamily={onFamily}
            onClose={onClose}
            onWithdraw={onWithdraw}
            onOpenConv={onOpenConv}
          />
        </motion.div>
      ))}
    </div>
  );
}

function ProposalCard({
  proposal,
  actingId,
  isSent,
  onAccept,
  onDecline,
  onIntroduction,
  onFamily,
  onClose,
  onWithdraw,
  onOpenConv,
}: {
  proposal: Proposal;
  actingId: string | null;
  isSent?: boolean;
  onAccept?: (p: Proposal) => void;
  onDecline?: (p: Proposal) => void;
  onIntroduction?: (p: Proposal) => void;
  onFamily?: (p: Proposal) => void;
  onClose?: (p: Proposal) => void;
  onWithdraw?: (p: Proposal) => void;
  onOpenConv?: (p: Proposal) => void;
}) {
  const busy = actingId === proposal.id;
  const DirectionIcon = proposal.direction === "sent" ? ArrowUpRight : ArrowDownLeft;
  const isActive = ACTIVE_STATUSES.includes(proposal.status);
  const isAccepted = proposal.status === "ACCEPTED";

  return (
    <Card className="bg-white border-[#D6B77A]/25 shadow-lux hover:shadow-lux-lg transition-shadow">
      <CardContent className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                proposal.direction === "sent"
                  ? "bg-[#D6B77A]/15 text-[#D6B77A]"
                  : "bg-[#C88F91]/15 text-[#C88F91]"
              }`}
            >
              <DirectionIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-lg text-foreground truncate">
                {proposal.counterpartyName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })}
                {proposal.direction === "sent" ? " · sent by you" : " · received"}
              </p>
            </div>
          </div>
          <Badge className={`${statusClass(proposal.status)} border gap-1`}>
            {PROPOSAL_STATUS_LABELS[proposal.status] ?? proposal.status}
          </Badge>
        </div>

        {/* Message */}
        {proposal.message && (
          <div className="mt-4 rounded-lg bg-[#F3EEE2]/50 border border-[#D6B77A]/15 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Message
            </p>
            <p className="text-sm text-foreground leading-relaxed italic">
              &ldquo;{proposal.message}&rdquo;
            </p>
          </div>
        )}

        {/* Flags */}
        {(proposal.introductionRequested || proposal.familyInvolved) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {proposal.introductionRequested && (
              <Badge className="bg-[#5a6b8a]/10 text-[#5a6b8a] border border-[#5a6b8a]/30 text-[11px]">
                Introduction requested
              </Badge>
            )}
            {proposal.familyInvolved && (
              <Badge className="bg-[#8E7CC3]/10 text-[#6b5b9e] border border-[#8E7CC3]/30 text-[11px]">
                <Users className="h-3 w-3" /> Family involved
              </Badge>
            )}
          </div>
        )}

        {/* Timeline */}
        {proposal.statusHistory.length > 0 && (
          <div className="mt-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Timeline
            </p>
            <Timeline history={proposal.statusHistory} />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[#D6B77A]/15">
          {!isSent && isActive && onAccept && (
            <Button
              size="sm"
              onClick={() => onAccept(proposal)}
              disabled={busy}
              className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Accept
            </Button>
          )}
          {!isSent && isActive && onDecline && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDecline(proposal)}
              disabled={busy}
              className="border-[#C88F91]/40 text-[#9b5f61] hover:bg-[#C88F91]/10"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Decline
            </Button>
          )}
          {!isSent && isActive && onIntroduction && proposal.status !== "INTRODUCTION_REQUESTED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onIntroduction(proposal)}
              disabled={busy}
              className="border-[#5a6b8a]/40 text-[#5a6b8a] hover:bg-[#5a6b8a]/10"
            >
              Request introduction
            </Button>
          )}
          {isActive && onFamily && proposal.status !== "FAMILY_DISCUSSION" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onFamily(proposal)}
              disabled={busy}
              className="border-[#8E7CC3]/40 text-[#6b5b9e] hover:bg-[#8E7CC3]/10"
            >
              <Users className="h-4 w-4" /> Involve family
            </Button>
          )}
          {isSent && isActive && onWithdraw && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onWithdraw(proposal)}
              disabled={busy}
              className="border-[#B23A48]/40 text-[#B23A48] hover:bg-[#B23A48]/10"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              Withdraw
            </Button>
          )}
          {isActive && onClose && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onClose(proposal)}
              disabled={busy}
              className="text-muted-foreground"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Close
            </Button>
          )}
          {isAccepted && onOpenConv && (
            <Button
              size="sm"
              onClick={() => onOpenConv(proposal)}
              className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] ml-auto"
            >
              <MessageCircle className="h-4 w-4" /> Open conversation
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Timeline({ history }: { history: StatusHistoryEntry[] }) {
  return (
    <ol className="relative border-l border-[#D6B77A]/30 ml-2 space-y-4">
      {history.map((entry, i) => {
        const isLast = i === history.length - 1;
        return (
          <li key={`${entry.status}-${i}`} className="ml-4 relative">
            <span
              className={`absolute -left-[1.4rem] flex h-3 w-3 items-center justify-center rounded-full ${
                isLast
                  ? "bg-[#D6B77A] ring-2 ring-[#D6B77A]/30"
                  : "bg-white border-2 border-[#D6B77A]/40"
              }`}
            />
            <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-sm font-medium text-foreground">
                {PROPOSAL_STATUS_LABELS[entry.status] ?? entry.status}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.date), { addSuffix: true })}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
