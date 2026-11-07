"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  CheckCheck,
  Clock,
  Inbox,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useNav } from "@/lib/store";

interface Message {
  id: string;
  senderId: string;
  senderType: string;
  body: string;
  attachments: string[];
  createdAt: string;
  readByReceiver: boolean;
}

interface Conversation {
  id: string;
  otherProfileId: string;
  lastUpdated: string;
  messages: Message[];
}

interface MessagesResponse {
  conversations: Conversation[];
}

export default function MessagesView() {
  const { selectedConversationId } = useNav();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (!res.ok) {
        toast.error("Could not load conversations.");
        return;
      }
      const data = (await res.json()) as MessagesResponse;
      const convs = Array.isArray(data?.conversations) ? data.conversations : [];
      setConversations(convs);
      // auto-select via nav
      if (selectedConversationId) {
        const exists = convs.find((c) => c.id === selectedConversationId);
        if (exists) {
          setActiveId(exists.id);
          setMobileThread(true);
        }
      } else if (convs.length > 0 && !activeId) {
        setActiveId(convs[0].id);
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }, [selectedConversationId, activeId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [activeId, conversations]);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  async function sendMessage() {
    if (!active) return;
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: active.id, body }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; messageId?: string };
      if (!res.ok) {
        toast.error(data?.error ?? "Could not send message.");
        setSending(false);
        return;
      }
      setDraft("");
      await load();
    } catch {
      toast.error("Network error.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function conversationLabel(c: Conversation) {
    return `Member ${c.otherProfileId.slice(0, 6)}`;
  }

  function lastMessagePreview(c: Conversation): string {
    const last = c.messages[c.messages.length - 1];
    if (!last) return "No messages yet";
    return last.body.length > 48 ? `${last.body.slice(0, 48)}…` : last.body;
  }

  function unreadCount(c: Conversation): number {
    // Messages received from the other profile that haven't been read yet.
    return c.messages.filter(
      (m) => !m.readByReceiver && m.senderId === c.otherProfileId
    ).length;
  }

  return (
    <div className="bg-lux-gradient min-h-[calc(100vh-4rem)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-4 py-10 md:py-14"
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
            <MessageCircle className="h-5 w-5 text-[#D6B77A]" />
          </div>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-2">
            Private messages
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-foreground">
            Your <span className="text-gold-gradient">conversations</span>
          </h1>
        </div>

        {/* Notice */}
        <Alert className="mb-6 border-[#D6B77A]/30 bg-white/70 backdrop-blur-sm shadow-lux">
          <ShieldCheck className="h-4 w-4 text-[#D6B77A]" />
          <AlertDescription className="text-sm text-muted-foreground">
            Messaging is available only after a mutual interest or introduction has
            been approved. Contact details are never shared automatically.
          </AlertDescription>
        </Alert>

        {loading ? (
          <div className="grid md:grid-cols-[320px_1fr] gap-6 h-[28rem]">
            <Skeleton className="rounded-2xl bg-white/60" />
            <Skeleton className="rounded-2xl bg-white/60" />
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid md:grid-cols-[340px_1fr] gap-4 md:gap-6 h-[34rem] md:h-[36rem]">
            {/* Conversation list */}
            <Card
              className={`bg-white border-[#D6B77A]/25 shadow-lux overflow-hidden ${
                mobileThread ? "hidden md:flex" : "flex"
              } flex-col`}
            >
              <div className="px-4 py-3 border-b border-[#D6B77A]/15 bg-[#F3EEE2]/40">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Conversations ({conversations.length})
                </p>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-lux">
                {conversations.map((c) => {
                  const unread = unreadCount(c);
                  const isActive = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveId(c.id);
                        setMobileThread(true);
                      }}
                      className={`w-full text-left px-4 py-3.5 border-b border-[#D6B77A]/10 transition-colors ${
                        isActive ? "bg-[#D6B77A]/10" : "hover:bg-[#F3EEE2]/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lux-gradient ring-1 ring-[#D6B77A]/30">
                              <span className="font-serif text-xs text-[#111827]">
                                {c.otherProfileId.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${isActive ? "font-medium text-foreground" : "text-foreground"}`}>
                              {conversationLabel(c)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 truncate">
                            {lastMessagePreview(c)}
                          </p>
                        </div>
                        {unread > 0 && (
                          <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D6B77A] text-[#111827] text-[10px] font-medium px-1.5">
                            {unread}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(c.lastUpdated), { addSuffix: true })}
                      </p>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Thread */}
            <Card
              className={`bg-white border-[#D6B77A]/25 shadow-lux overflow-hidden ${
                mobileThread ? "flex" : "hidden md:flex"
              } flex-col`}
            >
              {!active ? (
                <div className="flex-1 flex items-center justify-center text-center px-6">
                  <div>
                    <MessageCircle className="mx-auto h-8 w-8 text-[#D6B77A]/50 mb-3" />
                    <p className="font-serif text-lg text-foreground">Select a conversation</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose a conversation from the list to view messages.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Thread header */}
                  <div className="px-4 py-3 border-b border-[#D6B77A]/15 bg-[#F3EEE2]/40 flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden h-8 w-8"
                      onClick={() => setMobileThread(false)}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lux-gradient ring-1 ring-[#D6B77A]/30">
                      <span className="font-serif text-xs text-[#111827]">
                        {active.otherProfileId.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-sm text-foreground truncate">
                        {conversationLabel(active)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Private · introduction approved
                      </p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    ref={threadRef}
                    className="flex-1 overflow-y-auto scrollbar-lux p-4 space-y-3 bg-lux-gradient/40"
                  >
                    {active.messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center">
                        <div>
                          <MessageCircle className="mx-auto h-8 w-8 text-[#D6B77A]/50 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Start the conversation with a respectful message.
                          </p>
                        </div>
                      </div>
                    ) : (
                      active.messages.map((m) => {
                        const isMine = m.senderType === "member" && m.senderId !== active.otherProfileId;
                        return (
                          <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25 }}
                            className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                                isMine
                                  ? "bg-gradient-to-br from-[#D6B77A] to-[#B8964A] text-[#111827] rounded-br-sm shadow-lux"
                                  : "glass-lux text-foreground rounded-bl-sm"
                              }`}
                            >
                              {m.senderType === "family_rep" && (
                                <p className="text-[10px] uppercase tracking-wider opacity-70 mb-0.5 flex items-center gap-1">
                                  <Users className="h-3 w-3" /> Family rep
                                </p>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {m.body}
                              </p>
                              <div
                                className={`flex items-center gap-1 mt-1 ${
                                  isMine ? "justify-end" : "justify-start"
                                }`}
                              >
                                <span className="text-[10px] opacity-70">
                                  {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                                </span>
                                {isMine && m.readByReceiver && (
                                  <CheckCheck className="h-3 w-3 opacity-70" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>

                  {/* Composer */}
                  <div className="border-t border-[#D6B77A]/15 bg-white p-3">
                    <div className="flex items-end gap-2">
                      <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a respectful message… (Enter to send, Shift+Enter for newline)"
                        rows={2}
                        className="resize-none bg-[#F3EEE2]/40 border-[#D6B77A]/25"
                        maxLength={2000}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={sending || !draft.trim()}
                        className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] h-10 px-4"
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Enter to send · Shift+Enter for a new line · {draft.length}/2000
                    </p>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* Family note */}
        {conversations.length > 0 && (
          <Alert className="mt-6 border-[#8E7CC3]/25 bg-white/60">
            <Users className="h-4 w-4 text-[#8E7CC3]" />
            <AlertDescription className="text-sm text-muted-foreground">
              You can authorise a family representative to participate in a specific
              introduction from the Family Involvement page.
            </AlertDescription>
          </Alert>
        )}
      </motion.div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="bg-white border-[#D6B77A]/20 shadow-lux">
      <CardContent className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F3EEE2] ring-1 ring-[#D6B77A]/30">
          <Inbox className="h-6 w-6 text-[#D6B77A]" />
        </div>
        <p className="font-serif text-xl text-foreground">
          You have no conversations yet
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Conversations begin when a matrimonial proposal is accepted. Discover
          members and send a respectful proposal to start.
        </p>
      </CardContent>
    </Card>
  );
}
