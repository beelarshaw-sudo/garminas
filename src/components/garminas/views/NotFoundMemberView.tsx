"use client";

import { motion } from "framer-motion";
import { Compass, Home, LogIn, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNav } from "@/lib/store";

export default function NotFoundMemberView() {
  const setView = useNav((s) => s.setView);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-lux-gradient flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-lg w-full text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ring-gold bg-white shadow-lux">
          <ShieldAlert className="h-7 w-7 text-[#D6B77A]" />
        </div>
        <p className="text-xs tracking-[0.3em] uppercase text-[#C88F91] mb-3">
          Member access required
        </p>
        <h1 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
          Please sign in to continue
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          This area of GarMinas is reserved for verified members. Sign in to your
          account, or return to the public side of the platform to learn more
          about our community.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => setView("login")}
            className="bg-[#D6B77A] text-[#111827] hover:bg-[#E8D9B5]"
          >
            <LogIn className="h-4 w-4" /> Sign in
          </Button>
          <Button
            variant="outline"
            onClick={() => setView("home")}
            className="border-[#D6B77A]/40 hover:bg-[#F3EEE2]"
          >
            <Home className="h-4 w-4" /> Return home
          </Button>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-xs text-muted-foreground/70">
          <Compass className="h-3.5 w-3.5 text-[#D6B77A]" />
          GarMinas · A connection that leads to forever
        </div>
      </motion.div>
    </div>
  );
}
