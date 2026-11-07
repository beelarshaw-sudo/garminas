"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  Loader2,
  Mail,
  Phone,
  ShieldOff,
  Sparkles,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";

interface FamilyRep {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone?: string | null;
  status: string;
  permissions?: string | null;
  invitedAt?: string;
}

const RELATIONSHIPS = [
  "father",
  "mother",
  "guardian",
  "elder_sibling",
  "other",
] as const;

interface Permissions {
  canViewProfile: boolean;
  canSendMessage: boolean;
  canRequestIntroduction: boolean;
}

function parsePermissions(raw?: string | null): Permissions {
  if (!raw) return { canViewProfile: false, canSendMessage: false, canRequestIntroduction: false };
  try {
    const p = JSON.parse(raw) as Partial<Permissions>;
    return {
      canViewProfile: !!p.canViewProfile,
      canSendMessage: !!p.canSendMessage,
      canRequestIntroduction: !!p.canRequestIntroduction,
    };
  } catch {
    return { canViewProfile: false, canSendMessage: false, canRequestIntroduction: false };
  }
}

export default function FamilyView() {
  const [reps, setReps] = useState<FamilyRep[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // form
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<(typeof RELATIONSHIPS)[number]>("father");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [canViewProfile, setCanViewProfile] = useState(true);
  const [canSendMessage, setCanSendMessage] = useState(false);
  const [canRequestIntroduction, setCanRequestIntroduction] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/family", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not load family representatives.");
        return;
      }
      const data = await res.json();
      setReps(Array.isArray(data?.familyReps) ? data.familyReps : []);
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please provide a name and email.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          relationship,
          email,
          phone: phone || undefined,
          permissions: { canViewProfile, canSendMessage, canRequestIntroduction },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not invite representative.");
        setSubmitting(false);
        return;
      }
      toast.success("Invitation sent.");
      setName("");
      setEmail("");
      setPhone("");
      setCanViewProfile(true);
      setCanSendMessage(false);
      setCanRequestIntroduction(false);
      await load();
    } catch {
      toast.error("Network error.");
      setSubmitting(false);
    }
  }

  async function revoke(rep: FamilyRep) {
    setRevokingId(rep.id);
    try {
      const res = await fetch(`/api/family/${rep.id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not revoke representative.");
        return;
      }
      toast.success("Representative revoked.");
      await load();
    } catch {
      toast.error("Network error.");
    } finally {
      setRevokingId(null);
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
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <Users className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Family involvement
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Optional, controlled family participation
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Invite trusted family members to support your matrimonial search —
            with limited, clearly defined permissions.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
          {/* Invite form */}
          <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
            <CardHeader>
              <CardTitle className="font-serif text-xl flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#D6B77A]" /> Invite a family representative
              </CardTitle>
              <CardDescription>
                Up to 3 active representatives. You can revoke at any time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Karim Ali" required />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Select value={relationship} onValueChange={(v) => setRelationship(v as (typeof RELATIONSHIPS)[number])}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIPS.map((r) => (
                        <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="representative@email.com" className="pl-9" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 1234567" className="pl-9" />
                  </div>
                </div>
                <Separator className="bg-[#D6B77A]/20 my-2" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Permissions</p>
                  <div className="space-y-3">
                    <PermissionRow checked={canViewProfile} onChange={setCanViewProfile} label="View my profile" />
                    <PermissionRow checked={canSendMessage} onChange={setCanSendMessage} label="Send messages on my behalf" />
                    <PermissionRow checked={canRequestIntroduction} onChange={setCanRequestIntroduction} label="Request introductions" />
                  </div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {!submitting && <Heart className="h-4 w-4" />}
                  Send invitation
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Existing reps */}
          <div className="space-y-4">
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Your family representatives</CardTitle>
                <CardDescription>
                  {reps.filter((r) => r.status !== "revoked").length} active · {reps.length} total
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A] mr-2" /> Loading…
                  </div>
                ) : reps.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="mx-auto h-8 w-8 text-[#D6B77A]/50 mb-3" />
                    <p className="font-serif text-lg text-foreground">No representatives yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Invite someone you trust to support your search.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {reps.map((r) => {
                      const perms = parsePermissions(r.permissions);
                      return (
                        <li key={r.id} className="rounded-md border border-[#D6B77A]/20 bg-[#F3EEE2]/40 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground truncate">{r.name}</p>
                                <Badge
                                  variant="outline"
                                  className={`border-[#D6B77A]/40 text-xs capitalize ${
                                    r.status === "revoked" ? "text-muted-foreground" : "text-[#C88F91]"
                                  }`}
                                >
                                  {r.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                {r.relationship.replace("_", " ")} · {r.email}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {perms.canViewProfile && <PermBadge label="View profile" />}
                                {perms.canSendMessage && <PermBadge label="Send messages" />}
                                {perms.canRequestIntroduction && <PermBadge label="Request intros" />}
                                {!perms.canViewProfile && !perms.canSendMessage && !perms.canRequestIntroduction && (
                                  <span className="text-xs text-muted-foreground italic">No permissions granted</span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revoke(r)}
                              disabled={revokingId === r.id || r.status === "revoked"}
                              className="text-[#B23A48] hover:bg-[#B23A48]/10"
                            >
                              {revokingId === r.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <UserMinus className="h-4 w-4" />
                              )}
                              Revoke
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <div className="rounded-md border border-[#C88F91]/30 bg-[#C88F91]/5 p-4 text-sm text-muted-foreground flex gap-2">
              <ShieldOff className="h-4 w-4 text-[#C88F91] shrink-0 mt-0.5" />
              <span>
                Family representatives never gain unrestricted access to private
                conversations, account credentials or personal information.
                Participation is voluntary and controlled by you.
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PermissionRow({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="data-[state=checked]:bg-[#D6B77A] data-[state=checked]:text-[#111827] data-[state=checked]:border-[#D6B77A]" />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function PermBadge({ label }: { label: string }) {
  return (
    <Badge className="bg-[#D6B77A]/15 text-[#111827] border border-[#D6B77A]/40 text-xs">
      {label}
    </Badge>
  );
}
