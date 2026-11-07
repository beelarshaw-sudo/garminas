"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Flag,
  Inbox,
  Loader2,
  Lock,
  MessageSquare,
  MoreHorizontal,
  ScrollText,
  Shield,
  ShieldCheck,
  Ticket,
  TrendingUp,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/store";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "MODERATOR", "VERIFIER"];

// ── API types ──────────────────────────────────────────────
interface AnalyticsTotals {
  total: number;
  verified: number;
  approved: number;
  active: number;
  proposals: number;
  accepted: number;
  openReports: number;
  openTickets: number;
}
interface AnalyticsResponse {
  totals: AnalyticsTotals;
  trend: { day: string; count: number }[];
}

interface VerificationInfo {
  identityVerified: boolean;
  communityVerified: boolean;
  profileApproved: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
}
interface AdminMember {
  id: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string | null;
  profile: {
    id: string;
    fullName: string | null;
    completionPercent: number;
    verification: VerificationInfo | null;
  } | null;
}

interface VerificationRecord {
  id: string;
  profileId: string;
  identityVerified: boolean;
  communityVerified: boolean;
  profileApproved: boolean;
  status: string;
  createdAt: string;
  profile: { fullName: string | null; userId: string } | null;
}

interface Report {
  id: string;
  reason: string;
  details?: string | null;
  status: string;
  resolution?: string | null;
  createdAt: string;
  reporter: { email: string } | null;
  subject: { email: string } | null;
}

interface TicketResponse {
  id: string;
  body: string;
  responderRole?: string | null;
  createdAt: string;
}
interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  user: { email: string } | null;
  responses: TicketResponse[];
}

interface AuditLog {
  id: string;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

const ROLE_OPTIONS = ["MEMBER", "MODERATOR", "VERIFIER", "ADMIN", "SUPER_ADMIN"];

const PIE_COLORS = ["#D6B77A", "#E5DCC8", "#C88F91"];

export default function AdminView() {
  const session = useSession((s) => s.session);
  const refresh = useSession((s) => s.refresh);
  const [tab, setTab] = useState("overview");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    refresh().then(() => setAuthChecked(true));
  }, [refresh]);

  const role = (session as { role?: string } | null)?.role ?? "";
  const authorized = ADMIN_ROLES.includes(role);

  if (!authChecked || useSession.getState().loading) {
    return (
      <div className="bg-lux-gradient min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#D6B77A]" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="bg-lux-gradient min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="bg-white border-[#C88F91]/40 shadow-lux max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#C88F91]/15 ring-1 ring-[#C88F91]/30">
              <Lock className="h-6 w-6 text-[#C88F91]" />
            </div>
            <p className="font-serif text-xl text-foreground">Not authorized</p>
            <p className="text-sm text-muted-foreground mt-2">
              Administrator access is required to view this dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 py-10 md:py-12"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
              Administration
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              GarMinas <span className="text-gold-gradient">console</span>
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Signed in as <span className="text-foreground font-medium">{role}</span> ·
              use these tools with discretion and care.
            </p>
          </div>
          <Badge className="bg-[#D6B77A]/15 text-[#B8964A] border border-[#D6B77A]/40 gap-1.5 py-1.5 px-3">
            <Shield className="h-3.5 w-3.5" />
            Privileged access
          </Badge>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <div className="overflow-x-auto scrollbar-lux pb-2">
            <TabsList className="bg-white border border-[#D6B77A]/25 shadow-lux h-auto">
              <TabsTrigger value="overview" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Overview</TabsTrigger>
              <TabsTrigger value="members" className="gap-1.5"><Users className="h-4 w-4" /> Members</TabsTrigger>
              <TabsTrigger value="verification" className="gap-1.5"><ShieldCheck className="h-4 w-4" /> Verification</TabsTrigger>
              <TabsTrigger value="moderation" className="gap-1.5"><Flag className="h-4 w-4" /> Moderation</TabsTrigger>
              <TabsTrigger value="support" className="gap-1.5"><Ticket className="h-4 w-4" /> Support</TabsTrigger>
              <TabsTrigger value="audit" className="gap-1.5"><ScrollText className="h-4 w-4" /> Audit Logs</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="members" className="mt-6">
            <MembersTab />
          </TabsContent>
          <TabsContent value="verification" className="mt-6">
            <VerificationTab />
          </TabsContent>
          <TabsContent value="moderation" className="mt-6">
            <ModerationTab />
          </TabsContent>
          <TabsContent value="support" className="mt-6">
            <SupportTab />
          </TabsContent>
          <TabsContent value="audit" className="mt-6">
            <AuditTab active={tab === "audit"} />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Overview
// ───────────────────────────────────────────────────────────
function OverviewTab() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/analytics", { cache: "no-store" });
        if (!res.ok) {
          toast.error("Could not load analytics.");
          return;
        }
        const d = (await res.json()) as AnalyticsResponse;
        if (!cancelled) setData(d);
      } catch {
        toast.error("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-white/60" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl bg-white/60" />
      </div>
    );
  }

  const stats: { label: string; value: number; icon: React.ComponentType<{ className?: string }> }[] = [
    { label: "Total registrations", value: data.totals.total, icon: Users },
    { label: "Verified members", value: data.totals.verified, icon: ShieldCheck },
    { label: "Approved profiles", value: data.totals.approved, icon: Check },
    { label: "Active members", value: data.totals.active, icon: Activity },
    { label: "Proposals sent", value: data.totals.proposals, icon: TrendingUp },
    { label: "Proposals accepted", value: data.totals.accepted, icon: HeartIcon },
    { label: "Open reports", value: data.totals.openReports, icon: Flag },
    { label: "Open tickets", value: data.totals.openTickets, icon: Ticket },
  ];

  const unverified = Math.max(0, data.totals.total - data.totals.verified);
  const pieData = [
    { name: "Verified", value: data.totals.verified },
    { name: "Unverified", value: unverified },
  ];
  const approvedPie = [
    { name: "Approved", value: data.totals.approved },
    { name: "Pending", value: Math.max(0, data.totals.total - data.totals.approved) },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <StatTile key={s.label} {...s} />
        ))}
      </div>

      {/* Trend chart */}
      <Card className="bg-white border-[#D6B77A]/25 shadow-lux">
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#D6B77A]" />
            Registration trend (30 days)
          </CardTitle>
          <CardDescription>New member registrations per day.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5DCC8" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#6B6457" }}
                  tickFormatter={(v: string) => v.slice(5)}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 11, fill: "#6B6457" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#FFFFFF",
                    border: "1px solid #D6B77A55",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#111827" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#D6B77A"
                  strokeWidth={2.5}
                  dot={{ fill: "#D6B77A", r: 2 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Two small pies */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white border-[#D6B77A]/25 shadow-lux">
          <CardHeader>
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#D6B77A]" />
              Verified vs unverified
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid #D6B77A55", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D6B77A]" /> Verified ({data.totals.verified})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E5DCC8]" /> Unverified ({unverified})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#D6B77A]/25 shadow-lux">
          <CardHeader>
            <CardTitle className="font-serif text-base flex items-center gap-2">
              <Check className="h-4 w-4 text-[#D6B77A]" />
              Approved vs pending profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={approvedPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {approvedPie.map((_, i) => (
                      <Cell key={i} fill={[PIE_COLORS[0], PIE_COLORS[2]][i % 2]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid #D6B77A55", borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D6B77A]" /> Approved ({data.totals.approved})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#C88F91]" /> Pending ({Math.max(0, data.totals.total - data.totals.approved)})
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="bg-white border-[#D6B77A]/25 shadow-lux hover:shadow-lux-lg transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D6B77A]/12 text-[#D6B77A]">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="font-serif text-3xl text-gold-gradient leading-none">{value}</p>
      </CardContent>
    </Card>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return <TrendingUp className={className} />;
}

// ───────────────────────────────────────────────────────────
// Members
// ───────────────────────────────────────────────────────────
function MembersTab() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [roleF, setRoleF] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (roleF) params.set("role", roleF);
      const res = await fetch(`/api/admin/members?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not load members.");
        return;
      }
      const d = (await res.json()) as { members: AdminMember[] };
      setMembers(Array.isArray(d?.members) ? d.members : []);
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }, [q, status, roleF]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, action: string, role?: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, role }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Action failed.");
        setActingId(null);
        return;
      }
      toast.success(`Action completed: ${action.replace("_", " ")}.`);
      await load();
    } catch {
      toast.error("Network error.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white border-[#D6B77A]/25 shadow-lux">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Search email or name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-[#F3EEE2]/40"
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full bg-white/60"><SelectValue placeholder="Any status" /></SelectTrigger>
              <SelectContent>
                {["PENDING", "ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"].map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={roleF} onValueChange={setRoleF}>
              <SelectTrigger className="w-full bg-white/60"><SelectValue placeholder="Any role" /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-[#D6B77A]/25 shadow-lux">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-md bg-[#F3EEE2]/60" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No members found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F3EEE2]/40 hover:bg-[#F3EEE2]/40">
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const v = m.profile?.verification;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-foreground">{m.email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.profile?.fullName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[#D6B77A]/30 text-[#6B6457]">{m.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={m.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          <VChip on={!!v?.identityVerified} label="ID" />
                          <VChip on={!!v?.communityVerified} label="C" />
                          <VChip on={!!v?.profileApproved} label="P" />
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.profile?.completionPercent ?? 0}%
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={actingId === m.id}>
                              {actingId === m.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Member actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => act(m.id, "approve_profile")}>
                              <Check className="h-4 w-4 text-emerald-600" /> Approve profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => act(m.id, "reject_profile")}>
                              <X className="h-4 w-4 text-[#C88F91]" /> Reject profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => act(m.id, "suspend")}>
                              <AlertTriangle className="h-4 w-4 text-[#C88F91]" /> Suspend
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => act(m.id, "reinstate")}>
                              <Activity className="h-4 w-4 text-emerald-600" /> Reinstate
                            </DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onClick={() => act(m.id, "ban")}>
                              <Lock className="h-4 w-4" /> Ban
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="gap-2">
                                <UserCog className="h-4 w-4" /> Set role
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="w-40">
                                {ROLE_OPTIONS.map((r) => (
                                  <DropdownMenuItem
                                    key={r}
                                    onClick={() => act(m.id, "set_role", r)}
                                    disabled={r === m.role}
                                  >
                                    {r}
                                    {r === m.role && <Check className="h-3.5 w-3.5 ml-auto" />}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDING: "bg-[#D6B77A]/15 text-[#B8964A] border-[#D6B77A]/40",
    SUSPENDED: "bg-[#C88F91]/15 text-[#9b5f61] border-[#C88F91]/40",
    BANNED: "bg-[#B23A48]/10 text-[#B23A48] border-[#B23A48]/30",
    DEACTIVATED: "bg-muted text-muted-foreground border-border",
    DELETED: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={map[status] ?? "bg-muted text-muted-foreground border-border"}>
      {status}
    </Badge>
  );
}

function VChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      title={label}
      className={`h-5 w-5 flex items-center justify-center rounded text-[9px] font-medium ${
        on
          ? "bg-[#D6B77A] text-[#111827]"
          : "bg-[#F3EEE2] text-muted-foreground border border-[#D6B77A]/20"
      }`}
    >
      {label}
    </span>
  );
}

// ───────────────────────────────────────────────────────────
// Verification
// ───────────────────────────────────────────────────────────
function VerificationTab() {
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{
    recordId: string;
    type: "identity" | "community" | "profile";
    approved: boolean;
  } | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verification", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not load verification records.");
        return;
      }
      const d = (await res.json()) as { records: VerificationRecord[] };
      setRecords(Array.isArray(d?.records) ? d.records : []);
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!dialog) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/verification?recordId=${dialog.recordId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: dialog.type,
          approved: dialog.approved,
          note: note.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Could not update record.");
        setSubmitting(false);
        return;
      }
      toast.success(`${dialog.type} ${dialog.approved ? "approved" : "rejected"}.`);
      setDialog(null);
      setNote("");
      await load();
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Alert className="border-[#D6B77A]/25 bg-white/60">
        <ShieldCheck className="h-4 w-4 text-[#D6B77A]" />
        <AlertDescription className="text-sm text-muted-foreground">
          Verification documents are restricted to authorized reviewers and deleted
          per the retention policy. Religious identity is never inferred from name,
          location or appearance.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-white/60" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <Card className="bg-white border-[#D6B77A]/20 shadow-lux">
          <CardContent className="py-12 text-center">
            <Check className="mx-auto h-8 w-8 text-emerald-600 mb-2" />
            <p className="font-serif text-lg text-foreground">No pending verification</p>
            <p className="text-sm text-muted-foreground mt-1">
              All submitted verifications have been reviewed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id} className="bg-white border-[#D6B77A]/25 shadow-lux">
              <CardContent className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-serif text-base text-foreground">
                      {r.profile?.fullName ?? "Unnamed member"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Record #{r.id.slice(0, 8)} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <VerifyStatus label="Identity" on={r.identityVerified} />
                      <VerifyStatus label="Community" on={r.communityVerified} />
                      <VerifyStatus label="Profile" on={r.profileApproved} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <ActionBtn
                      label="Approve ID"
                      tone="emerald"
                      onClick={() => {
                        setDialog({ recordId: r.id, type: "identity", approved: true });
                        setNote("");
                      }}
                    />
                    <ActionBtn
                      label="Reject ID"
                      tone="rose"
                      onClick={() => {
                        setDialog({ recordId: r.id, type: "identity", approved: false });
                        setNote("");
                      }}
                    />
                    <ActionBtn
                      label="Approve community"
                      tone="emerald"
                      onClick={() => {
                        setDialog({ recordId: r.id, type: "community", approved: true });
                        setNote("");
                      }}
                    />
                    <ActionBtn
                      label="Reject community"
                      tone="rose"
                      onClick={() => {
                        setDialog({ recordId: r.id, type: "community", approved: false });
                        setNote("");
                      }}
                    />
                    <ActionBtn
                      label="Approve profile"
                      tone="emerald"
                      onClick={() => {
                        setDialog({ recordId: r.id, type: "profile", approved: true });
                        setNote("");
                      }}
                    />
                    <ActionBtn
                      label="Reject profile"
                      tone="rose"
                      onClick={() => {
                        setDialog({ recordId: r.id, type: "profile", approved: false });
                        setNote("");
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {dialog?.approved ? "Approve" : "Reject"} {dialog?.type} verification
            </DialogTitle>
            <DialogDescription>
              Add an optional reviewer note. This will be recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional reviewer note…"
            maxLength={1000}
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              onClick={submit}
              disabled={submitting}
              className={
                dialog?.approved
                  ? "bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
                  : "bg-[#C88F91] text-white hover:bg-[#b07a7c]"
              }
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : dialog?.approved ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VerifyStatus({ label, on }: { label: string; on: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        on
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 gap-1"
          : "bg-[#F3EEE2] text-muted-foreground border-[#D6B77A]/25 gap-1"
      }
    >
      {on ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {label}
    </Badge>
  );
}

function ActionBtn({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "emerald" | "rose";
  onClick: () => void;
}) {
  const cls =
    tone === "emerald"
      ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
      : "border-[#C88F91]/40 text-[#9b5f61] hover:bg-[#C88F91]/10";
  return (
    <Button size="sm" variant="outline" onClick={onClick} className={`text-xs h-7 ${cls}`}>
      {label}
    </Button>
  );
}

// ───────────────────────────────────────────────────────────
// Moderation
// ───────────────────────────────────────────────────────────
function ModerationTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ reportId: string; status: string } | null>(null);
  const [resolution, setResolution] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not load reports.");
        return;
      }
      const d = (await res.json()) as { reports: Report[] };
      setReports(Array.isArray(d?.reports) ? d.reports : []);
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!dialog) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: dialog.reportId,
          status: dialog.status,
          resolution: resolution.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Could not update report.");
        setSubmitting(false);
        return;
      }
      toast.success(`Report ${dialog.status}.`);
      setDialog(null);
      setResolution("");
      await load();
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="bg-white border-[#D6B77A]/25 shadow-lux">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Flag className="h-4 w-4 text-[#C88F91]" /> Moderation queue
        </CardTitle>
        <CardDescription>Reports filed by members. Review and resolve discreetly.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-md bg-[#F3EEE2]/60" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Inbox className="mx-auto h-8 w-8 text-[#D6B77A]/50 mb-2" />
            No reports in the queue.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F3EEE2]/40 hover:bg-[#F3EEE2]/40">
                <TableHead>Reporter</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Filed</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs text-muted-foreground">{r.reporter?.email ?? "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{r.subject?.email ?? "—"}</TableCell>
                  <TableCell className="font-medium text-foreground text-sm">{r.reason}</TableCell>
                  <TableCell><ReportStatus status={r.status} /></TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1.5 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => {
                          setDialog({ reportId: r.id, status: "resolved" });
                          setResolution("");
                        }}
                      >
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-[#C88F91]/40 text-[#9b5f61] hover:bg-[#C88F91]/10"
                        onClick={() => {
                          setDialog({ reportId: r.id, status: "dismissed" });
                          setResolution("");
                        }}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {dialog?.status === "resolved" ? "Resolve report" : "Dismiss report"}
            </DialogTitle>
            <DialogDescription>
              Add an optional resolution note for the audit record.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Resolution note…"
            maxLength={1000}
            rows={4}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              onClick={submit}
              disabled={submitting}
              className={
                dialog?.status === "resolved"
                  ? "bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
                  : "bg-[#C88F91] text-white hover:bg-[#b07a7c]"
              }
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ReportStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-[#D6B77A]/15 text-[#B8964A] border-[#D6B77A]/40",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dismissed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={map[status] ?? "bg-muted text-muted-foreground border-border"}>
      {status}
    </Badge>
  );
}

// ───────────────────────────────────────────────────────────
// Support
// ───────────────────────────────────────────────────────────
function SupportTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not load tickets.");
        return;
      }
      const d = (await res.json()) as { tickets: SupportTicket[] };
      setTickets(Array.isArray(d?.tickets) ? d.tickets : []);
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function respond(ticketId: string, status?: string) {
    setActingId(ticketId);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          body: response.trim() || undefined,
          status,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Could not respond.");
        setActingId(null);
        return;
      }
      toast.success("Ticket updated.");
      setResponse("");
      await load();
    } catch {
      toast.error("Network error.");
    } finally {
      setActingId(null);
    }
  }

  return (
    <Card className="bg-white border-[#D6B77A]/25 shadow-lux">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Ticket className="h-4 w-4 text-[#D6B77A]" /> Support tickets
        </CardTitle>
        <CardDescription>Click a ticket to expand and respond.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-md bg-[#F3EEE2]/60" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            <Inbox className="mx-auto h-8 w-8 text-[#D6B77A]/50 mb-2" />
            No support tickets.
          </div>
        ) : (
          <div className="divide-y divide-[#D6B77A]/10">
            {tickets.map((t) => {
              const expanded = expandedId === t.id;
              return (
                <div key={t.id} className="px-4 py-3">
                  <button
                    onClick={() => {
                      setExpandedId(expanded ? null : t.id);
                      setResponse("");
                    }}
                    className="w-full text-left flex items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground text-sm truncate">{t.subject}</p>
                        <Badge variant="outline" className="text-[10px] border-[#D6B77A]/30 text-[#6B6457]">{t.category}</Badge>
                        <TicketStatus status={t.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.user?.email ?? "—"} · {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>
                  {expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.25 }}
                      className="mt-3 space-y-3"
                    >
                      <div className="rounded-lg bg-[#F3EEE2]/50 border border-[#D6B77A]/15 p-3">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Original message</p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{t.message}</p>
                      </div>
                      {t.responses.length > 0 && (
                        <div className="space-y-2">
                          {t.responses.map((r) => (
                            <div key={r.id} className="rounded-lg border border-[#D6B77A]/15 p-3 bg-white">
                              <p className="text-xs text-muted-foreground mb-1">
                                <MessageSquare className="inline h-3 w-3 mr-1" />
                                {r.responderRole ?? "Support"} · {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                              </p>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{r.body}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <Textarea
                        placeholder="Respond to this ticket…"
                        rows={3}
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        className="bg-[#F3EEE2]/40"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => respond(t.id, "in_progress")}
                          disabled={actingId === t.id || !response.trim()}
                          className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
                        >
                          {actingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                          Send & mark in progress
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => respond(t.id, "resolved")} disabled={actingId === t.id} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                          Resolve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => respond(t.id, "closed")} disabled={actingId === t.id} className="border-[#C88F91]/40 text-[#9b5f61] hover:bg-[#C88F91]/10">
                          Close
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TicketStatus({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-[#D6B77A]/15 text-[#B8964A] border-[#D6B77A]/40",
    in_progress: "bg-[#5a6b8a]/10 text-[#5a6b8a] border-[#5a6b8a]/30",
    resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    closed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={map[status] ?? "bg-muted text-muted-foreground border-border"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

// ───────────────────────────────────────────────────────────
// Audit Logs
// ───────────────────────────────────────────────────────────
function AuditTab({ active }: { active: boolean }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/audit-logs", { cache: "no-store" });
        if (!res.ok) {
          toast.error("Could not load audit logs.");
          return;
        }
        const d = (await res.json()) as { logs: AuditLog[] };
        if (!cancelled) setLogs(Array.isArray(d?.logs) ? d.logs : []);
      } catch {
        toast.error("Network error.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <Card className="bg-white border-[#D6B77A]/25 shadow-lux">
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-[#D6B77A]" /> Audit trail
        </CardTitle>
        <CardDescription>Auto-refreshes when this tab is opened. Last 200 events.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-md bg-[#F3EEE2]/60" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No audit entries yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#F3EEE2]/40 hover:bg-[#F3EEE2]/40">
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs">
                    <span className="text-foreground">{l.actorRole ?? "system"}</span>
                    {l.actorId && (
                      <span className="text-muted-foreground ml-1">#{l.actorId.slice(0, 6)}</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-foreground text-sm">
                    <code className="text-[#B8964A]">{l.action}</code>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.targetType ? `${l.targetType}${l.targetId ? ` #${l.targetId.slice(0, 6)}` : ""}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.ipAddress ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
