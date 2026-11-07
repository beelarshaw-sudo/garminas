"use client";

import { useEffect } from "react";
import { useNav, useSession } from "@/lib/store";
import { Header } from "@/components/garminas/Header";
import { Footer } from "@/components/garminas/Footer";
import { HomeView } from "@/components/garminas/HomeView";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// View imports
import AboutView from "@/components/garminas/views/AboutView";
import RegisterView from "@/components/garminas/views/RegisterView";
import LoginView from "@/components/garminas/views/LoginView";
import ProfileEditView from "@/components/garminas/views/ProfileEditView";
import DashboardView from "@/components/garminas/views/DashboardView";
import DiscoverView from "@/components/garminas/views/DiscoverView";
import ProfileDetailView from "@/components/garminas/views/ProfileDetailView";
import ProposalsView from "@/components/garminas/views/ProposalsView";
import MessagesView from "@/components/garminas/views/MessagesView";
import FamilyView from "@/components/garminas/views/FamilyView";
import VerifyView from "@/components/garminas/views/VerifyView";
import PrivacyView from "@/components/garminas/views/PrivacyView";
import NotificationsView from "@/components/garminas/views/NotificationsView";
import SafetyView from "@/components/garminas/views/SafetyView";
import SuccessStoriesView from "@/components/garminas/views/SuccessStoriesView";
import HelpView from "@/components/garminas/views/HelpView";
import AdminView from "@/components/garminas/views/AdminView";
import LegalView from "@/components/garminas/views/LegalView";
import GuidanceView from "@/components/garminas/views/GuidanceView";
import NotFoundMemberView from "@/components/garminas/views/NotFoundMemberView";

const MEMBER_ONLY_VIEWS = [
  "profile-create",
  "profile-edit",
  "dashboard",
  "discover",
  "profile-detail",
  "proposals",
  "messages",
  "family",
  "verify",
  "privacy",
  "notifications",
  "safety",
] as const;

const ADMIN_VIEWS = ["admin"] as const;

export default function Page() {
  const { view, setView } = useNav();
  const { session, loading, refresh } = useSession();

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Scroll to top on view change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [view]);

  const isMemberView = (MEMBER_ONLY_VIEWS as readonly string[]).includes(view);
  const isAdminView = (ADMIN_VIEWS as readonly string[]).includes(view);
  const needsAuth = isMemberView || isAdminView;

  // Show loader while we determine session
  const showLoader = needsAuth && loading;
  const blockedByAuth = needsAuth && !loading && !session;
  const blockedByRole =
    isAdminView &&
    !loading &&
    session &&
    !["ADMIN", "SUPER_ADMIN", "MODERATOR", "VERIFIER"].includes(session.role);

  function renderView() {
    if (showLoader) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--gold)" }} />
        </div>
      );
    }
    if (blockedByAuth) {
      return <NotFoundMemberView />;
    }
    if (blockedByRole) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h2 className="font-serif text-2xl font-semibold mb-2" style={{ color: "var(--navy)" }}>
            Administrator access required
          </h2>
          <p className="text-muted-foreground mb-6">
            You do not have permission to view this page.
          </p>
          <button
            className="rounded-md px-4 py-2 text-sm font-medium text-navy"
            style={{ background: "linear-gradient(135deg, #E8D9B5, #D6B77A)" }}
            onClick={() => setView("dashboard")}
          >
            Return to dashboard
          </button>
        </div>
      );
    }
    switch (view) {
      case "home":
        return <HomeView />;
      case "about":
        return <AboutView />;
      case "register":
        return <RegisterView />;
      case "login":
        return <LoginView />;
      case "profile-create":
      case "profile-edit":
        return <ProfileEditView />;
      case "dashboard":
        return <DashboardView />;
      case "discover":
        return <DiscoverView />;
      case "profile-detail":
        return <ProfileDetailView />;
      case "proposals":
        return <ProposalsView />;
      case "messages":
        return <MessagesView />;
      case "family":
        return <FamilyView />;
      case "verify":
        return <VerifyView />;
      case "privacy":
        return <PrivacyView />;
      case "notifications":
        return <NotificationsView />;
      case "safety":
        return <SafetyView />;
      case "success-stories":
        return <SuccessStoriesView />;
      case "help":
        return <HelpView />;
      case "admin":
        return <AdminView />;
      case "guidance":
        return <GuidanceView />;
      case "legal-terms":
      case "legal-privacy":
      case "legal-community":
      case "legal-matrimonial":
      case "legal-conduct":
      case "legal-verification":
      case "legal-safety":
      case "legal-cookie":
      case "legal-retention":
      case "legal-deletion":
      case "legal-reporting":
        return <LegalView />;
      default:
        return <HomeView />;
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
