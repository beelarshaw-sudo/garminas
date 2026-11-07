"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Database,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Monitor,
  Pause,
  Search,
  ShieldCheck,
  Trash2,
  UserX,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useNav, useSession } from "@/lib/store";

type VisibilityValue = "PUBLIC_APPROVED" | "APPROVED_ONLY" | "AFTER_INTRODUCTION" | "HIDDEN";

interface PrivacyState {
  hideProfile: boolean;
  inactivityPause: boolean;
  photoVisibility: VisibilityValue;
  profileVisibility: VisibilityValue;
  appearsInSearch: boolean;
  onlineStatusVisible: boolean;
  readReceiptsEnabled: boolean;
  familyInfoVisible: boolean;
}

const DEFAULT_PRIVACY: PrivacyState = {
  hideProfile: false,
  inactivityPause: false,
  photoVisibility: "APPROVED_ONLY",
  profileVisibility: "APPROVED_ONLY",
  appearsInSearch: true,
  onlineStatusVisible: true,
  readReceiptsEnabled: true,
  familyInfoVisible: true,
};

interface SessionInfo {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
}

export default function PrivacyView() {
  const setView = useNav((s) => s.setView);
  const refresh = useSession((s) => s.refresh);

  const [privacy, setPrivacy] = useState<PrivacyState>(DEFAULT_PRIVACY);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  const [exportData, setExportData] = useState<unknown>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function loadPrivacy() {
    try {
      const res = await fetch("/api/privacy", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data?.privacy) setPrivacy({ ...DEFAULT_PRIVACY, ...data.privacy });
      }
    } catch {
      toast.error("Could not load privacy settings.");
    } finally {
      setLoading(false);
    }
  }
  async function loadSessions() {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      }
    } catch {
      /* ignore */
    } finally {
      setSessionsLoading(false);
    }
  }

  useEffect(() => {
    loadPrivacy();
    loadSessions();
  }, []);

  async function patchPrivacy(patch: Partial<PrivacyState>, key: string) {
    setUpdating(key);
    try {
      const res = await fetch("/api/privacy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        toast.error("Could not update privacy setting.");
        return;
      }
      toast.success("Privacy setting updated.");
      setPrivacy((p) => ({ ...p, ...patch }));
    } catch {
      toast.error("Network error.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleExport() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/account?action=export", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Export failed.");
        return;
      }
      setExportData(data?.export ?? data);
      setExportOpen(true);
      toast.success("Data export ready.");
    } catch {
      toast.error("Network error.");
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeactivate() {
    try {
      const res = await fetch("/api/account?action=deactivate", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error ?? "Deactivation failed.");
        return;
      }
      toast.success("Account deactivated.");
      await refresh();
      setView("home");
    } catch {
      toast.error("Network error.");
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== "DELETE") {
      toast.error("Type DELETE to confirm permanent deletion.");
      return;
    }
    try {
      const res = await fetch("/api/account?action=delete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error ?? "Deletion failed.");
        return;
      }
      toast.success("Account permanently deleted.");
      await refresh();
      setView("home");
    } catch {
      toast.error("Network error.");
    }
  }

  async function logoutAll() {
    try {
      const res = await fetch("/api/session", { method: "POST" });
      if (!res.ok) {
        toast.error("Could not log out other sessions.");
        return;
      }
      toast.success("Logged out of all devices.");
      await refresh();
      setView("home");
    } catch {
      toast.error("Network error.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-lux-gradient flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#D6B77A]" />
      </div>
    );
  }

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-3xl mx-auto px-4 py-10 md:py-14 space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <ShieldCheck className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Privacy centre
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Your privacy, your control
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Adjust how your profile appears, when you appear in search, and what
            others can see about you.
          </p>
        </div>

        {/* Profile state toggles */}
        <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Profile state</CardTitle>
            <CardDescription>Pause or hide your presence on GarMinas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              icon={EyeOff}
              label="Hide profile temporarily"
              description="Your profile will not be visible to other members until you unhide."
              checked={privacy.hideProfile}
              loading={updating === "hideProfile"}
              onChange={(v) => patchPrivacy({ hideProfile: v }, "hideProfile")}
            />
            <ToggleRow
              icon={Pause}
              label="Pause due to inactivity"
              description="Mark yourself as inactive. You will not appear in recommendations."
              checked={privacy.inactivityPause}
              loading={updating === "inactivityPause"}
              onChange={(v) => patchPrivacy({ inactivityPause: v }, "inactivityPause")}
            />
          </CardContent>
        </Card>

        {/* Visibility radios */}
        <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Photo & profile visibility</CardTitle>
            <CardDescription>Choose who can see your photographs and full profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <VisibilityRadio
              label="Photograph visibility"
              value={privacy.photoVisibility}
              loading={updating === "photoVisibility"}
              onChange={(v) => patchPrivacy({ photoVisibility: v }, "photoVisibility")}
            />
            <Separator className="bg-[#D6B77A]/20" />
            <VisibilityRadio
              label="Profile visibility"
              value={privacy.profileVisibility}
              loading={updating === "profileVisibility"}
              onChange={(v) => patchPrivacy({ profileVisibility: v }, "profileVisibility")}
            />
          </CardContent>
        </Card>

        {/* Switches */}
        <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Activity & information</CardTitle>
            <CardDescription>Fine-grained controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleRow
              icon={Search}
              label="Appear in search results"
              description="Allow approved members to find you via search."
              checked={privacy.appearsInSearch}
              loading={updating === "appearsInSearch"}
              onChange={(v) => patchPrivacy({ appearsInSearch: v }, "appearsInSearch")}
            />
            <ToggleRow
              icon={Eye}
              label="Online status visible"
              description="Show when you are active on GarMinas."
              checked={privacy.onlineStatusVisible}
              loading={updating === "onlineStatusVisible"}
              onChange={(v) => patchPrivacy({ onlineStatusVisible: v }, "onlineStatusVisible")}
            />
            <ToggleRow
              icon={Monitor}
              label="Read receipts"
              description="Let others see when you've read their messages."
              checked={privacy.readReceiptsEnabled}
              loading={updating === "readReceiptsEnabled"}
              onChange={(v) => patchPrivacy({ readReceiptsEnabled: v }, "readReceiptsEnabled")}
            />
            <ToggleRow
              icon={ShieldCheck}
              label="Family information displayed"
              description="Show your family background details on your profile."
              checked={privacy.familyInfoVisible}
              loading={updating === "familyInfoVisible"}
              onChange={(v) => patchPrivacy({ familyInfoVisible: v }, "familyInfoVisible")}
            />
          </CardContent>
        </Card>

        {/* Account section */}
        <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Account</CardTitle>
            <CardDescription>Export your data or close your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" onClick={handleExport} disabled={exportLoading} className="w-full justify-start border-[#D6B77A]/40 hover:bg-[#F3EEE2]">
              {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Request data export
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start border-[#C88F91]/40 text-[#C88F91] hover:bg-[#C88F91]/10">
                  <UserX className="h-4 w-4" /> Deactivate account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your profile will be hidden and you will be marked as inactive.
                    You can sign in again later to reactivate. This does not
                    permanently delete your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeactivate} className="bg-[#C88F91] text-white hover:bg-[#B23A48]">
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start border-[#B23A48]/40 text-[#B23A48] hover:bg-[#B23A48]/10">
                  <Trash2 className="h-4 w-4" /> Permanently delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[#B23A48]">This action is irreversible</AlertDialogTitle>
                  <AlertDialogDescription>
                    Permanently deleting your account will purge your personal
                    information, photographs, and profile. Verification documents
                    are purged per retention policy. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="delete-confirm" className="text-xs uppercase tracking-wider">
                    Type <span className="font-mono text-[#B23A48]">DELETE</span> to confirm
                  </Label>
                  <input
                    id="delete-confirm"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="border border-[#B23A48]/40 rounded-md px-3 py-2 w-full text-sm"
                  />
                </div>
                <div className="rounded-md bg-[#B23A48]/10 border border-[#B23A48]/30 p-3 text-xs text-[#B23A48] flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    If you are unsure, consider deactivating instead. You can
                    always return to delete your account later.
                  </span>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleteConfirm !== "DELETE"}
                    className="bg-[#B23A48] text-white hover:bg-[#9A2F3C]"
                  >
                    Permanently delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        {/* Active sessions */}
        <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="font-serif text-xl">Active sessions</CardTitle>
              <CardDescription>Devices currently signed in to your account.</CardDescription>
            </div>
            <Button onClick={logoutAll} variant="outline" size="sm" className="border-[#C88F91]/40 text-[#C88F91] hover:bg-[#C88F91]/10">
              <LogOut className="h-4 w-4" /> Log out of all
            </Button>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A] mr-2" /> Loading…
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active sessions found.</p>
            ) : (
              <ul className="space-y-3">
                {sessions.map((s) => (
                  <li key={s.id} className="rounded-md border border-[#D6B77A]/20 bg-[#F3EEE2]/40 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#D6B77A]">
                        <Monitor className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {s.userAgent || "Unknown device"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.ipAddress || "IP unknown"} · Created{" "}
                          {new Date(s.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Expires {new Date(s.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center italic">
          {`${Math.round((Object.values(privacy).filter((v) => v === true || v === "PUBLIC_APPROVED" || v === "APPROVED_ONLY").length / 8) * 100)}% of privacy controls are currently active.`}
        </p>
      </motion.div>

      {/* Export dialog */}
      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Your data export</DialogTitle>
            <DialogDescription>
              A JSON snapshot of the information GarMinas holds about your
              account. Treat this file as confidential.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[24rem] rounded-md border border-[#D6B77A]/30 bg-[#F3EEE2]/40 p-3">
            <pre className="text-xs font-mono whitespace-pre-wrap break-words text-foreground/90">
              {JSON.stringify(exportData, null, 2)}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-[#D6B77A]/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3EEE2] text-[#D6B77A]">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {loading && <Loader2 className="h-3 w-3 animate-spin text-[#D6B77A]" />}
        <Switch checked={checked} onCheckedChange={(v) => onChange(v === true)} className="data-[state=checked]:bg-[#D6B77A]" />
      </div>
    </div>
  );
}

function VisibilityRadio({
  label,
  value,
  onChange,
  loading,
}: {
  label: string;
  value: VisibilityValue;
  onChange: (v: VisibilityValue) => void;
  loading?: boolean;
}) {
  const options: { value: VisibilityValue; label: string; description: string }[] = [
    { value: "PUBLIC_APPROVED", label: "Public to approved", description: "All approved members" },
    { value: "APPROVED_ONLY", label: "Approved only", description: "Only approved members you've allowed" },
    { value: "AFTER_INTRODUCTION", label: "After introduction", description: "Only after a proposal is accepted" },
    { value: "HIDDEN", label: "Hidden", description: "No one can see this" },
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-medium">{label}</Label>
        {loading && <Loader2 className="h-3 w-3 animate-spin text-[#D6B77A]" />}
      </div>
      <RadioGroup value={value} onValueChange={(v) => onChange(v as VisibilityValue)} className="grid sm:grid-cols-2 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-colors ${
              value === o.value
                ? "border-[#D6B77A] bg-[#D6B77A]/10"
                : "border-[#D6B77A]/20 hover:bg-[#F3EEE2]/60"
            }`}
          >
            <RadioGroupItem value={o.value} className="mt-0.5 text-[#D6B77A]" />
            <div>
              <p className="text-sm font-medium text-foreground">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.description}</p>
            </div>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
