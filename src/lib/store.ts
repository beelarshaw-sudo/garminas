"use client";

import { create } from "zustand";
import { ViewKey } from "@/lib/garminas";

interface NavState {
  view: ViewKey;
  selectedProfileId: string | null;
  selectedProposalId: string | null;
  selectedConversationId: string | null;
  selectedGuidanceSlug: string | null;
  legalView: string | null;
  setView: (v: ViewKey) => void;
  openProfile: (profileId: string) => void;
  openProposal: (proposalId: string) => void;
  openConversation: (conversationId: string) => void;
  openGuidance: (slug: string) => void;
  openLegal: (slug: string) => void;
}

export const useNav = create<NavState>((set) => ({
  view: "home",
  selectedProfileId: null,
  selectedProposalId: null,
  selectedConversationId: null,
  selectedGuidanceSlug: null,
  legalView: null,
  setView: (v) => set({ view: v }),
  openProfile: (profileId) =>
    set({ view: "profile-detail", selectedProfileId: profileId }),
  openProposal: (proposalId) =>
    set({ view: "proposals", selectedProposalId: proposalId }),
  openConversation: (conversationId) =>
    set({ view: "messages", selectedConversationId: conversationId }),
  openGuidance: (slug) => set({ view: "guidance", selectedGuidanceSlug: slug }),
  openLegal: (slug) => set({ view: "legal-terms", legalView: slug }),
}));

// Lightweight client-side session cache (mirrors /api/auth/me).
interface ClientSession {
  userId: string;
  email: string;
  role: string;
  status: string;
  profileApproved: boolean;
  profileComplete: number;
  fullName?: string;
  profileId?: string;
  accountType?: string;
  subscriptionActive?: boolean;
  subscriptionStatus?: string;
  subscriptionExpiresAt?: string | null;
}

interface SessionState {
  session: ClientSession | null;
  loading: boolean;
  setSession: (s: ClientSession | null) => void;
  setLoading: (b: boolean) => void;
  refresh: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  session: null,
  loading: true,
  setSession: (s) => set({ session: s }),
  setLoading: (b) => set({ loading: b }),
  refresh: async () => {
    try {
      const r = await fetch("/api/auth/me", { cache: "no-store" });
      if (!r.ok) {
        set({ session: null, loading: false });
        return;
      }
      const data = await r.json();
      set({ session: data.session ?? null, loading: false });
    } catch {
      set({ session: null, loading: false });
    }
  },
}));
