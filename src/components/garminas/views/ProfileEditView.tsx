"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  Check,
  Eye,
  Heart,
  Image as ImageIcon,
  Loader2,
  Save,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useNav, useSession } from "@/lib/store";
import {
  EDUCATION_LEVELS,
  GARMINAS_DISTRICTS,
  MARITAL_STATUSES,
  PROFESSION_CATEGORIES,
} from "@/lib/garminas";

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC_APPROVED", label: "Visible to all approved members" },
  { value: "APPROVED_ONLY", label: "Approved members only" },
  { value: "AFTER_INTRODUCTION", label: "Only after an introduction" },
  { value: "HIDDEN", label: "Hidden from everyone" },
] as const;

type VisibilityValue = (typeof VISIBILITY_OPTIONS)[number]["value"];

interface ProfileData {
  fullName?: string;
  heightCm?: number | null;
  maritalStatus?: string;
  languages?: string[];
  city?: string;
  district?: string;
  currentResidence?: string;
  connectionToGB?: string;
  education?: string;
  institution?: string;
  profession?: string;
  employmentStatus?: string;
  careerInfo?: string;
  business?: string;
  familyIntro?: string;
  fatherOccupation?: string;
  motherOccupation?: string;
  siblingCount?: number | null;
  familyDistrict?: string;
  familyBackground?: string;
  aboutMe?: string;
  qualitiesValued?: string;
  primaryPhoto?: string;
  photos?: string[];
  photoVisibility?: VisibilityValue;
  profileVisibility?: VisibilityValue;
  appearsInSearch?: boolean;
  onlineStatusVisible?: boolean;
  readReceiptsEnabled?: boolean;
  familyInfoVisible?: boolean;
  completionPercent?: number;
}

interface PreferencesData {
  preferredAgeMin?: number | null;
  preferredAgeMax?: number | null;
  preferredLocation?: string[];
  educationPrefs?: string;
  professionPrefs?: string;
  maritalStatusPrefs?: string[];
  lifestyleExpectations?: string;
  familyExpectations?: string;
  personalValues?: string;
}

export default function ProfileEditView() {
  const setView = useNav((s) => s.setView);
  const refresh = useSession((s) => s.refresh);

  const [profile, setProfile] = useState<ProfileData>({});
  const [preferences, setPreferences] = useState<PreferencesData>({});
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, prefRes] = await Promise.all([
          fetch("/api/profile", { cache: "no-store" }),
          fetch("/api/profile/preferences", { cache: "no-store" }),
        ]);
        if (pRes.ok) {
          const pd = await pRes.json();
          setProfile(pd?.profile ?? {});
        }
        if (prefRes.ok) {
          const pf = await prefRes.json();
          setPreferences(pf?.preferences ?? {});
        }
      } catch {
        toast.error("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // completion percent from API (or compute)
  const completionPct = useMemo(() => {
    if (typeof profile.completionPercent === "number") return profile.completionPercent;
    const fields = [
      profile.fullName,
      profile.heightCm,
      profile.maritalStatus,
      profile.languages,
      profile.city,
      profile.education,
      profile.profession,
      profile.familyIntro,
      profile.aboutMe,
      profile.qualitiesValued,
      profile.primaryPhoto,
    ];
    const filled = fields.filter((v) => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.length > 0;
      return String(v).trim() !== "";
    }).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  function set<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }
  function setPref<K extends keyof PreferencesData>(key: K, value: PreferencesData[K]) {
    setPreferences((p) => ({ ...p, [key]: value }));
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const payload: Record<string, unknown> = {
        fullName: profile.fullName,
        heightCm: profile.heightCm ? Number(profile.heightCm) : undefined,
        maritalStatus: profile.maritalStatus,
        languages: typeof profile.languages === "string"
          ? (profile.languages as string).split(",").map((s) => s.trim()).filter(Boolean)
          : profile.languages,
        city: profile.city,
        district: profile.district,
        currentResidence: profile.currentResidence,
        connectionToGB: profile.connectionToGB,
        education: profile.education,
        institution: profile.institution,
        profession: profile.profession,
        employmentStatus: profile.employmentStatus,
        careerInfo: profile.careerInfo,
        business: profile.business,
        familyIntro: profile.familyIntro,
        fatherOccupation: profile.fatherOccupation,
        motherOccupation: profile.motherOccupation,
        siblingCount: profile.siblingCount ? Number(profile.siblingCount) : undefined,
        familyDistrict: profile.familyDistrict,
        familyBackground: profile.familyBackground,
        aboutMe: profile.aboutMe,
        qualitiesValued: profile.qualitiesValued,
        primaryPhoto: profile.primaryPhoto,
        photos: profile.photos,
        photoVisibility: profile.photoVisibility,
        profileVisibility: profile.profileVisibility,
        appearsInSearch: profile.appearsInSearch,
        onlineStatusVisible: profile.onlineStatusVisible,
        readReceiptsEnabled: profile.readReceiptsEnabled,
        familyInfoVisible: profile.familyInfoVisible,
      };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not save profile.");
        return;
      }
      toast.success("Profile saved.");
      if (data?.profile?.completionPercent != null) {
        setProfile((p) => ({ ...p, completionPercent: data.profile.completionPercent }));
      }
      await refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePreferences() {
    setSavingPrefs(true);
    try {
      const payload: Record<string, unknown> = {
        preferredAgeMin: preferences.preferredAgeMin ? Number(preferences.preferredAgeMin) : undefined,
        preferredAgeMax: preferences.preferredAgeMax ? Number(preferences.preferredAgeMax) : undefined,
        preferredLocation: typeof preferences.preferredLocation === "string"
          ? (preferences.preferredLocation as string).split(",").map((s) => s.trim()).filter(Boolean)
          : preferences.preferredLocation,
        educationPrefs: preferences.educationPrefs,
        professionPrefs: preferences.professionPrefs,
        maritalStatusPrefs: preferences.maritalStatusPrefs,
        lifestyleExpectations: preferences.lifestyleExpectations,
        familyExpectations: preferences.familyExpectations,
        personalValues: preferences.personalValues,
      };
      const res = await fetch("/api/profile/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Could not save preferences.");
        return;
      }
      toast.success("Preferences saved.");
      await refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setSavingPrefs(false);
    }
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("Please choose an image smaller than 1.5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setProfile((p) => ({
        ...p,
        primaryPhoto: result,
        photos: [result, ...(p.photos ?? [])].slice(0, 6),
      }));
      toast.success("Photo loaded. Save to confirm.");
    };
    reader.onerror = () => toast.error("Could not read image.");
    reader.readAsDataURL(file);
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
        className="max-w-5xl mx-auto px-4 py-10 md:py-14"
      >
        {/* Header with completion */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
              Profile editor
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              Build your profile
            </h1>
            <p className="text-muted-foreground text-sm mt-2 max-w-xl">
              A complete, honest profile receives serious, considered attention.
              Save each section before moving on.
            </p>
          </div>
          <Card className="bg-white border-[#D6B77A]/30 shadow-lux w-full md:w-72">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Completion</span>
                <span className="text-sm font-serif text-foreground">{completionPct}%</span>
              </div>
              <Progress value={completionPct} className="bg-[#F3EEE2] h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completionPct < 100 ? "Add more detail to reach 100%." : "Your profile is complete."}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <ScrollArea className="w-full whitespace-px">
            <TabsList className="bg-white border border-[#D6B77A]/20 shadow-lux h-auto p-1 flex">
              <TabsTrigger value="personal" className="gap-1.5 data-[state=active]:bg-[#D6B77A] data-[state=active]:text-[#111827]">
                <User className="h-3.5 w-3.5" /> Personal
              </TabsTrigger>
              <TabsTrigger value="education" className="gap-1.5 data-[state=active]:bg-[#D6B77A] data-[state=active]:text-[#111827]">
                <Sparkles className="h-3.5 w-3.5" /> Education & Profession
              </TabsTrigger>
              <TabsTrigger value="family" className="gap-1.5 data-[state=active]:bg-[#D6B77A] data-[state=active]:text-[#111827]">
                <Users className="h-3.5 w-3.5" /> Family
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-1.5 data-[state=active]:bg-[#D6B77A] data-[state=active]:text-[#111827]">
                <Heart className="h-3.5 w-3.5" /> Preferences
              </TabsTrigger>
              <TabsTrigger value="about" className="gap-1.5 data-[state=active]:bg-[#D6B77A] data-[state=active]:text-[#111827]">
                <Sparkles className="h-3.5 w-3.5" /> About me
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-1.5 data-[state=active]:bg-[#D6B77A] data-[state=active]:text-[#111827]">
                <Camera className="h-3.5 w-3.5" /> Photos
              </TabsTrigger>
              <TabsTrigger value="visibility" className="gap-1.5 data-[state=active]:bg-[#D6B77A] data-[state=active]:text-[#111827]">
                <Eye className="h-3.5 w-3.5" /> Visibility
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          {/* Personal */}
          <TabsContent value="personal" className="mt-4">
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Personal details</CardTitle>
                <CardDescription>The foundation of your matrimonial profile.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <Field label="Full name">
                  <Input value={profile.fullName ?? ""} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full name" />
                </Field>
                <Field label="Height (cm)">
                  <Input type="number" min={120} max={230} value={profile.heightCm ?? ""} onChange={(e) => set("heightCm", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 170" />
                </Field>
                <Field label="Marital status">
                  <Select value={profile.maritalStatus ?? ""} onValueChange={(v) => set("maritalStatus", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{MARITAL_STATUSES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Languages (comma-separated)">
                  <Input
                    value={Array.isArray(profile.languages) ? profile.languages.join(", ") : (profile.languages as string) ?? ""}
                    onChange={(e) => set("languages", e.target.value)}
                    placeholder="e.g. Urdu, English, Burushaski"
                  />
                </Field>
                <Field label="Current city">
                  <Input value={profile.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Karachi" />
                </Field>
                <Field label="District connection">
                  <Select value={profile.district ?? ""} onValueChange={(v) => set("district", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{GARMINAS_DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Current residence">
                  <Input value={profile.currentResidence ?? ""} onChange={(e) => set("currentResidence", e.target.value)} placeholder="e.g. Karachi, Pakistan" />
                </Field>
                <Field label="Connection to Gilgit-Baltistan">
                  <Input value={profile.connectionToGB ?? ""} onChange={(e) => set("connectionToGB", e.target.value)} placeholder="e.g. Born in Hunza" />
                </Field>
              </CardContent>
              <SaveBar onSave={saveProfile} saving={savingProfile} />
            </Card>
          </TabsContent>

          {/* Education & Profession */}
          <TabsContent value="education" className="mt-4">
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Education & profession</CardTitle>
                <CardDescription>Your academic and professional journey.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <Field label="Education level">
                  <Select value={profile.education ?? ""} onValueChange={(v) => set("education", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{EDUCATION_LEVELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Institution">
                  <Input value={profile.institution ?? ""} onChange={(e) => set("institution", e.target.value)} placeholder="e.g. Aga Khan University" />
                </Field>
                <Field label="Profession category">
                  <Select value={profile.profession ?? ""} onValueChange={(v) => set("profession", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{PROFESSION_CATEGORIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Employment status">
                  <Input value={profile.employmentStatus ?? ""} onChange={(e) => set("employmentStatus", e.target.value)} placeholder="e.g. Employed full-time" />
                </Field>
                <Field label="Career info" full>
                  <Textarea value={profile.careerInfo ?? ""} onChange={(e) => set("careerInfo", e.target.value)} placeholder="Brief notes about your career path and aspirations." />
                </Field>
                <Field label="Business (if applicable)" full>
                  <Input value={profile.business ?? ""} onChange={(e) => set("business", e.target.value)} placeholder="e.g. Family tourism business in Gilgit" />
                </Field>
              </CardContent>
              <SaveBar onSave={saveProfile} saving={savingProfile} />
            </Card>
          </TabsContent>

          {/* Family */}
          <TabsContent value="family" className="mt-4">
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Family background</CardTitle>
                <CardDescription>Optional — only visible per your privacy settings.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <Field label="Family introduction" full>
                  <Textarea value={profile.familyIntro ?? ""} onChange={(e) => set("familyIntro", e.target.value)} placeholder="A short, dignified introduction to your family." />
                </Field>
                <Field label="Father's occupation">
                  <Input value={profile.fatherOccupation ?? ""} onChange={(e) => set("fatherOccupation", e.target.value)} placeholder="e.g. Retired education officer" />
                </Field>
                <Field label="Mother's occupation">
                  <Input value={profile.motherOccupation ?? ""} onChange={(e) => set("motherOccupation", e.target.value)} placeholder="e.g. Homemaker" />
                </Field>
                <Field label="Number of siblings">
                  <Input type="number" min={0} max={20} value={profile.siblingCount ?? ""} onChange={(e) => set("siblingCount", e.target.value ? Number(e.target.value) : null)} placeholder="e.g. 3" />
                </Field>
                <Field label="Family district">
                  <Select value={profile.familyDistrict ?? ""} onValueChange={(v) => set("familyDistrict", v)}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{GARMINAS_DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Family background" full>
                  <Textarea value={profile.familyBackground ?? ""} onChange={(e) => set("familyBackground", e.target.value)} placeholder="A brief, respectful note about your family's roots and traditions." />
                </Field>
              </CardContent>
              <SaveBar onSave={saveProfile} saving={savingProfile} />
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="mt-4">
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Marriage preferences</CardTitle>
                <CardDescription>What you are respectfully seeking.</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4">
                <Field label="Preferred age — minimum">
                  <Input type="number" min={18} max={99} value={preferences.preferredAgeMin ?? ""} onChange={(e) => setPref("preferredAgeMin", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Preferred age — maximum">
                  <Input type="number" min={18} max={99} value={preferences.preferredAgeMax ?? ""} onChange={(e) => setPref("preferredAgeMax", e.target.value ? Number(e.target.value) : null)} />
                </Field>
                <Field label="Preferred locations (comma-separated)" full>
                  <Input
                    value={Array.isArray(preferences.preferredLocation) ? preferences.preferredLocation.join(", ") : (preferences.preferredLocation as string) ?? ""}
                    onChange={(e) => setPref("preferredLocation", e.target.value)}
                    placeholder="e.g. Karachi, Islamabad, Hunza"
                  />
                </Field>
                <Field label="Education preferences">
                  <Input value={preferences.educationPrefs ?? ""} onChange={(e) => setPref("educationPrefs", e.target.value)} placeholder="e.g. Bachelor's or higher" />
                </Field>
                <Field label="Profession preferences">
                  <Input value={preferences.professionPrefs ?? ""} onChange={(e) => setPref("professionPrefs", e.target.value)} placeholder="e.g. Any professional field" />
                </Field>
                <Field label="Acceptable marital statuses" full>
                  <div className="grid sm:grid-cols-2 gap-2 rounded-md border border-[#D6B77A]/25 p-3 bg-[#F3EEE2]/40">
                    {MARITAL_STATUSES.map((m) => {
                      const checked = (preferences.maritalStatusPrefs ?? []).includes(m);
                      return (
                        <label key={m} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const arr = new Set(preferences.maritalStatusPrefs ?? []);
                              if (v === true) arr.add(m);
                              else arr.delete(m);
                              setPref("maritalStatusPrefs", Array.from(arr));
                            }}
                            className="data-[state=checked]:bg-[#D6B77A] data-[state=checked]:text-[#111827] data-[state=checked]:border-[#D6B77A]"
                          />
                          <span className="text-sm">{m}</span>
                        </label>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Lifestyle expectations" full>
                  <Textarea value={preferences.lifestyleExpectations ?? ""} onChange={(e) => setPref("lifestyleExpectations", e.target.value)} placeholder="e.g. Family-oriented, faith-centred, balanced work and home life." />
                </Field>
                <Field label="Family expectations" full>
                  <Textarea value={preferences.familyExpectations ?? ""} onChange={(e) => setPref("familyExpectations", e.target.value)} placeholder="e.g. Mutually respectful involvement of both families." />
                </Field>
                <Field label="Personal values" full>
                  <Textarea value={preferences.personalValues ?? ""} onChange={(e) => setPref("personalValues", e.target.value)} placeholder="e.g. Honesty, kindness, faith, lifelong learning." />
                </Field>
              </CardContent>
              <SaveBar onSave={savePreferences} saving={savingPrefs} label="Save preferences" />
            </Card>
          </TabsContent>

          {/* About */}
          <TabsContent value="about" className="mt-4">
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl">About me</CardTitle>
                <CardDescription>Honest, thoughtful self-introduction.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label={`About me — ${(profile.aboutMe ?? "").length} / 2000`} full>
                  <Textarea
                    value={profile.aboutMe ?? ""}
                    onChange={(e) => set("aboutMe", e.target.value.slice(0, 2000))}
                    placeholder="Describe who you are today, your values, and what you hope to build with a future spouse."
                    className="min-h-40"
                  />
                </Field>
                <Field label={`Qualities you value — ${(profile.qualitiesValued ?? "").length} / 1500`} full>
                  <Textarea
                    value={profile.qualitiesValued ?? ""}
                    onChange={(e) => set("qualitiesValued", e.target.value.slice(0, 1500))}
                    placeholder="e.g. Honesty, kindness, emotional maturity, family devotion."
                    className="min-h-32"
                  />
                </Field>
              </CardContent>
              <SaveBar onSave={saveProfile} saving={savingProfile} />
            </Card>
          </TabsContent>

          {/* Photos */}
          <TabsContent value="photos" className="mt-4">
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Photographs</CardTitle>
                <CardDescription>A clear, recent photograph helps serious introductions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-[180px_1fr] gap-5 items-start">
                  <div className="aspect-[3/4] rounded-md border border-[#D6B77A]/30 bg-[#F3EEE2] overflow-hidden flex items-center justify-center">
                    {profile.primaryPhoto ? (
                      <img src={profile.primaryPhoto} alt="Primary photo preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-[#D6B77A]/50" />
                    )}
                  </div>
                  <div className="space-y-3">
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-md bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] px-4 py-2 text-sm font-medium transition-colors">
                      <Camera className="h-4 w-4" /> Choose a photo
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Choose a clear, recent photograph (under 1.5 MB). The image
                      is stored locally for your preview and saved as your
                      primary photo when you press Save below.
                    </p>
                    <Field label="Photo visibility">
                      <Select value={profile.photoVisibility ?? "APPROVED_ONLY"} onValueChange={(v) => set("photoVisibility", v as VisibilityValue)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>{VISIBILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>
              </CardContent>
              <SaveBar onSave={saveProfile} saving={savingProfile} />
            </Card>
          </TabsContent>

          {/* Visibility */}
          <TabsContent value="visibility" className="mt-4">
            <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Visibility & privacy</CardTitle>
                <CardDescription>Control how your profile appears to others.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Photo visibility">
                    <Select value={profile.photoVisibility ?? "APPROVED_ONLY"} onValueChange={(v) => set("photoVisibility", v as VisibilityValue)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{VISIBILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Profile visibility">
                    <Select value={profile.profileVisibility ?? "APPROVED_ONLY"} onValueChange={(v) => set("profileVisibility", v as VisibilityValue)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{VISIBILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                </div>
                <ToggleRow
                  label="Appear in search results"
                  description="Allow other approved members to discover you in search."
                  checked={profile.appearsInSearch ?? true}
                  onChange={(v) => set("appearsInSearch", v)}
                />
                <ToggleRow
                  label="Online status visible"
                  description="Show when you are active on GarMinas."
                  checked={profile.onlineStatusVisible ?? true}
                  onChange={(v) => set("onlineStatusVisible", v)}
                />
                <ToggleRow
                  label="Read receipts"
                  description="Let others see when you have read their messages."
                  checked={profile.readReceiptsEnabled ?? true}
                  onChange={(v) => set("readReceiptsEnabled", v)}
                />
                <ToggleRow
                  label="Family information displayed"
                  description="Show family background details on your profile."
                  checked={profile.familyInfoVisible ?? true}
                  onChange={(v) => set("familyInfoVisible", v)}
                />
                <div className="rounded-md border border-[#C88F91]/30 bg-[#C88F91]/5 p-3 text-xs text-muted-foreground flex gap-2">
                  <Eye className="h-4 w-4 text-[#C88F91] shrink-0" />
                  <span>
                    For full control — including pausing your profile and managing
                    active sessions — visit the{" "}
                    <button onClick={() => setView("privacy")} className="text-[#D6B77A] hover:underline">Privacy Centre</button>.
                  </span>
                </div>
              </CardContent>
              <SaveBar onSave={saveProfile} saving={savingProfile} />
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2" : ""}`}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SaveBar({ onSave, saving, label = "Save changes" }: { onSave: () => void; saving: boolean; label?: string }) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#D6B77A]/15 bg-[#F3EEE2]/30">
      <Button onClick={onSave} disabled={saving} className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving…" : label}
      </Button>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-[#D6B77A]/20 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={(v) => onChange(v === true)} className="data-[state=checked]:bg-[#D6B77A]" />
    </div>
  );
}
