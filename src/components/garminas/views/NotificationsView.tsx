"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCheck,
  Heart,
  Loader2,
  Mail,
  MessageCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNav } from "@/lib/store";
import type { ViewKey } from "@/lib/garminas";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  proposal_received: Heart,
  message: MessageCircle,
  verification: ShieldAlert,
  system: Sparkles,
  default: Bell,
};

function timeAgo(iso: string): string {
  try {
    const d = new Date(iso).getTime();
    const diff = Date.now() - d;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    const wk = Math.floor(day / 7);
    if (wk < 5) return `${wk}w ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "";
  }
}

export default function NotificationsView() {
  const setView = useNav((s) => s.setView);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not load notifications.");
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAllRead() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (!res.ok) {
        toast.error("Could not update notifications.");
        return;
      }
      toast.success("All notifications marked as read.");
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleClick(n: NotificationItem) {
    if (!n.read) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id }),
        });
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
        );
      } catch {
        /* ignore */
      }
    }
    if (n.link) {
      setView(n.link as ViewKey);
    }
  }

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-3xl mx-auto px-4 py-10 md:py-14"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
              Notification centre
            </p>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground">
              Your notifications
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
                : "You're all caught up."}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={markAllRead}
            disabled={actionLoading || unreadCount === 0}
            className="border-[#D6B77A]/40 hover:bg-[#F3EEE2]"
          >
            {actionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4" />
            )}
            Mark all read
          </Button>
        </div>

        <Card className="bg-white border-[#D6B77A]/30 shadow-lux">
          <CardHeader className="border-b border-[#D6B77A]/15">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Bell className="h-4 w-4 text-[#D6B77A]" /> Inbox
            </CardTitle>
            <CardDescription>
              Notifications are ordered newest first.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-[#D6B77A] mr-2" />
                Loading…
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <Mail className="mx-auto h-8 w-8 text-[#D6B77A]/50 mb-3" />
                <p className="font-serif text-lg text-foreground">
                  Nothing here yet.
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  New activity — proposals, messages, verification updates — will
                  appear here.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[28rem]">
                <ul className="divide-y divide-[#D6B77A]/15">
                  {items.map((n) => {
                    const Icon = TYPE_ICON[n.type] ?? TYPE_ICON.default;
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => handleClick(n)}
                          className={`w-full text-left flex gap-4 px-5 py-4 transition-colors hover:bg-[#F3EEE2]/60 ${
                            n.read ? "" : "bg-[#D6B77A]/5"
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                              n.read
                                ? "bg-[#F3EEE2] text-muted-foreground"
                                : "ring-gold bg-white text-[#D6B77A]"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-3">
                              <p
                                className={`text-sm ${
                                  n.read
                                    ? "text-foreground/70 font-normal"
                                    : "text-foreground font-medium"
                                }`}
                              >
                                {n.title}
                              </p>
                              <span className="text-[11px] text-muted-foreground shrink-0">
                                {timeAgo(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {n.body ?? "Open GarMinas to review."}
                            </p>
                          </div>
                          {!n.read && (
                            <span className="mt-2 h-2 w-2 rounded-full bg-[#C88F91] shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Separator className="bg-[#D6B77A]/20 my-6" />

        <p className="text-xs text-muted-foreground text-center italic">
          Sensitive matrimonial details are masked in notification previews by
          default. Full details are visible only inside the application after you
          sign in.
        </p>
      </motion.div>
    </div>
  );
}
