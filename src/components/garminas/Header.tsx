"use client";

import { motion } from "framer-motion";
import { useNav, useSession } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu, Heart, Bell, ChevronDown, LogOut, User } from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ViewKey } from "@/lib/garminas";

const PUBLIC_NAV: { key: ViewKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "success-stories", label: "Success Stories" },
  { key: "help", label: "Help" },
];

const MEMBER_NAV: { key: ViewKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "discover", label: "Discover" },
  { key: "proposals", label: "Proposals" },
  { key: "messages", label: "Messages" },
];

const ACCOUNT_NAV: { key: ViewKey; label: string }[] = [
  { key: "profile-edit", label: "Edit Profile" },
  { key: "verify", label: "Verification" },
  { key: "family", label: "Family" },
  { key: "privacy", label: "Privacy Centre" },
  { key: "notifications", label: "Notifications" },
  { key: "safety", label: "Safety" },
  { key: "guidance", label: "Guidance" },
];

export function Header() {
  const { view, setView } = useNav();
  const { session, loading, refresh } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.unread) setUnread(d.unread);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [session, view]);

  const isAdmin = session && ["ADMIN", "SUPER_ADMIN", "MODERATOR", "VERIFIER"].includes(session.role);

  const navItems = session
    ? [...MEMBER_NAV, ...(isAdmin ? [{ key: "admin" as ViewKey, label: "Admin" }] : [])]
    : PUBLIC_NAV;

  const initials = session?.fullName
    ? session.fullName
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "GM";

  function NavButton({ item }: { item: { key: ViewKey; label: string } }) {
    const active = view === item.key;
    return (
      <button
        onClick={() => {
          setView(item.key);
          setMobileOpen(false);
        }}
        className={cn(
          "relative px-3 py-2 text-sm font-medium transition-colors rounded-md",
          active
            ? "text-navy"
            : "text-muted-foreground hover:text-navy"
        )}
        style={active ? { color: "var(--navy)" } : undefined}
      >
        {item.label}
        {active && (
          <motion.div
            layoutId="nav-underline"
            className="absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full"
            style={{ background: "linear-gradient(90deg, #D6B77A, #C88F91)" }}
          />
        )}
      </button>
    );
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    setView("home");
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: "rgba(250, 247, 240, 0.85)",
        backdropFilter: "blur(16px) saturate(180%)",
        borderColor: "rgba(214, 183, 122, 0.25)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => setView("home")}
          className="flex items-center gap-2 group"
          aria-label="GarMinas home"
        >
          <div className="relative h-9 w-9 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-9 w-9">
              <defs>
                <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E8D9B5" />
                  <stop offset="50%" stopColor="#D6B77A" />
                  <stop offset="100%" stopColor="#B8964A" />
                </linearGradient>
              </defs>
              <circle cx="14" cy="18" r="8" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
              <circle cx="22" cy="18" r="8" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" />
            </svg>
          </div>
          <div className="flex flex-col items-start leading-none">
            <span className="font-serif text-xl font-semibold tracking-tight" style={{ color: "var(--navy)" }}>
              GarMinas
            </span>
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Matrimonial
            </span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavButton key={item.key} item={item} />
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session ? (
            <>
              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setView("notifications")}
                  aria-label={`${unread} unread notifications`}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white" style={{ background: "var(--rose)" }}>
                    {unread > 9 ? "9+" : unread}
                  </span>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-muted transition-colors">
                    <Avatar className="h-8 w-8 ring-gold">
                      <AvatarFallback className="text-xs font-semibold" style={{ background: "linear-gradient(135deg, #D6B77A, #B8964A)", color: "var(--navy)" }}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{session.fullName || "Member"}</span>
                      <span className="text-xs text-muted-foreground truncate">{session.email}</span>
                      {session.role !== "MEMBER" && (
                        <Badge variant="outline" className="mt-1 w-fit text-[10px] border-gold">
                          {session.role.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ACCOUNT_NAV.map((item) => (
                    <DropdownMenuItem key={item.key} onClick={() => setView(item.key)}>
                      <User className="mr-2 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setView("login")}>
                Sign in
              </Button>
              <Button
                size="sm"
                onClick={() => setView("register")}
                className="text-navy"
                style={{
                  background: "linear-gradient(135deg, #E8D9B5 0%, #D6B77A 50%, #B8964A 100%)",
                }}
              >
                <Heart className="mr-1.5 h-3.5 w-3.5" />
                Register
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-serif text-xl">GarMinas</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavButton key={item.key} item={item} />
                ))}
                {!session && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <Button variant="outline" className="w-full justify-start" onClick={() => { setView("login"); setMobileOpen(false); }}>
                      Sign in
                    </Button>
                    <Button className="w-full justify-start text-navy" style={{ background: "linear-gradient(135deg, #E8D9B5, #D6B77A)" }} onClick={() => { setView("register"); setMobileOpen(false); }}>
                      Register
                    </Button>
                  </>
                )}
                {session && (
                  <>
                    <div className="my-2 h-px bg-border" />
                    <span className="px-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Account
                    </span>
                    {ACCOUNT_NAV.map((item) => (
                      <NavButton key={item.key} item={item} />
                    ))}
                    <div className="my-2 h-px bg-border" />
                    <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
