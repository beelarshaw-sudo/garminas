"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useNav, useSession } from "@/lib/store";
import { Header } from "@/components/garminas/Header";
import { Footer } from "@/components/garminas/Footer";
import { HomeView } from "@/components/garminas/HomeView";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// Code-split every view into its own chunk so the dev server only compiles
// the currently-displayed view, not all 20 at once. This dramatically reduces
// memory pressure during initial page load and view transitions.
const NotFoundMemberView = dynamic(
  () => import("@/components/garminas/views/NotFoundMemberView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const AboutView = dynamic(() => import("@/components/garminas/views/AboutView"), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const RegisterView = dynamic(
  () => import("@/components/garminas/views/RegisterView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const LoginView = dynamic(() => import("@/components/garminas/views/LoginView"), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const ProfileEditView = dynamic(
  () => import("@/components/garminas/views/ProfileEditView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const DashboardView = dynamic(
  () => import("@/components/garminas/views/DashboardView"),
  { ssr: false,
    loading: () => <ViewLoader /> }
);
const DiscoverView = dynamic(
  () => import("@/components/garminas/views/DiscoverView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const ProfileDetailView = dynamic(
  () => import("@/components/garminas/views/ProfileDetailView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const ProposalsView = dynamic(
  () => import("@/components/garminas/views/ProposalsView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const MessagesView = dynamic(
  () => import("@/components/garminas/views/MessagesView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const FamilyView = dynamic(
  () => import("@/components/garminas/views/FamilyView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const VerifyView = dynamic(
  () => import("@/components/garminas/views/VerifyView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const PrivacyView = dynamic(
  () => import("@/components/garminas/views/PrivacyView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const NotificationsView = dynamic(
  () => import("@/components/garminas/views/NotificationsView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const SafetyView = dynamic(
  () => import("@/components/garminas/views/SafetyView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const SuccessStoriesView = dynamic(
  () => import("@/components/garminas/views/SuccessStoriesView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const HelpView = dynamic(() => import("@/components/garminas/views/HelpView"), {
  ssr: false,
  loading: () => <ViewLoader />,
});
const AdminView = dynamic(
  () => import("@/components/garminas/views/AdminView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const LegalView = dynamic(
  () => import("@/components/garminas/views/LegalView"),
  { ssr: false, loading: () => <ViewLoader /> }
);
const GuidanceView = dynamic(
  () => import("@/components/garminas/views/GuidanceView"),
  { ssr: false, loading: () => <ViewLoader /> }
);

function ViewLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--gold)" }} />
    </div>
  );
}

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

  const showLoader = needsAuth && loading;
  const blockedByAuth = needsAuth && !loading && !session;
  const blockedByRole =
    isAdminView &&
    !loading &&
    session &&
    !["ADMIN", "SUPER_ADMIN", "MODERATOR", "VERIFIER"].includes(session.role);

  function renderView() {
    if (showLoader) {
      return <ViewLoader />;
    }
    if (blockedByAuth) {
      return <NotFoundMemberView />;
    }
    if (blockedByRole) {
      return (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <h2
            className="font-serif text-2xl font-semibold mb-2"
            style={{ color: "var(--navy)" }}
          >
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
