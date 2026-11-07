"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useNav, useSession } from "@/lib/store";

export default function LoginView() {
  const setView = useNav((s) => s.setView);
  const refresh = useSession((s) => s.refresh);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "Sign-in failed.");
        setLoading(false);
        return;
      }
      toast.success("Welcome back to GarMinas.");
      await refresh();
      setView("dashboard");
    } catch {
      toast.error("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-navy-gradient overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#D6B77A]/10 blur-3xl animate-float-slow" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#C88F91]/10 blur-3xl animate-float" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ring-gold bg-white/5">
            <Sparkles className="h-5 w-5 text-gold" />
          </div>
          <h1 className="font-serif text-3xl text-ivory">Welcome back</h1>
          <p className="mt-1 text-sm text-ivory/70">
            Sign in to continue your journey on GarMinas.
          </p>
        </div>

        <Card className="glass-dark border border-[#D6B77A]/25 shadow-lux-lg text-ivory">
          <CardHeader>
            <CardTitle className="text-gold-gradient text-2xl font-serif">Member sign-in</CardTitle>
            <CardDescription className="text-ivory/70">
              Your matrimonial profile is one step away.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-ivory/90">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/50" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-ivory/90">Password</Label>
                  <button
                    type="button"
                    onClick={() => toast("Password recovery is coming soon.", {
                      description: "Please contact support if you've lost access.",
                    })}
                    className="text-xs text-[#D6B77A] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/50" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-white/5 border-[#D6B77A]/30 text-ivory placeholder:text-ivory/40"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5] font-medium"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
          <Separator className="bg-[#D6B77A]/20" />
          <CardFooter className="flex flex-col gap-3 pt-4">
            <div className="w-full rounded-md border border-[#D6B77A]/20 bg-white/5 p-3 text-xs text-ivory/80">
              <div className="mb-1 flex items-center gap-1.5 text-[#D6B77A] font-medium">
                <ShieldCheck className="h-3.5 w-3.5" /> Demo credentials
              </div>
              <p>
                <span className="text-ivory/60">Admin:</span>{" "}
                <span className="font-mono">admin@garminas.demo</span>{" "}
                /{" "}
                <span className="font-mono">GarMinas@Admin2026</span>
              </p>
              <p>
                <span className="text-ivory/60">Member:</span>{" "}
                <span className="font-mono">member@garminas.demo</span>{" "}
                /{" "}
                <span className="font-mono">GarMinas@Member2026</span>
              </p>
            </div>
            <p className="text-center text-sm text-ivory/70">
              New to GarMinas?{" "}
              <button
                type="button"
                onClick={() => setView("register")}
                className="text-[#D6B77A] hover:underline font-medium"
              >
                Create an account
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
