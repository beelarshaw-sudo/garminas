"use client";

import { useNav } from "@/lib/store";
import { ViewKey } from "@/lib/garminas";
import { Heart, Shield, Lock } from "lucide-react";

const FOOTER_LINKS: { section: string; links: { key: ViewKey; label: string }[] }[] = [
  {
    section: "Platform",
    links: [
      { key: "about", label: "About GarMinas" },
      { key: "success-stories", label: "Success Stories" },
      { key: "guidance", label: "Guidance Library" },
      { key: "help", label: "Help & Support" },
    ],
  },
  {
    section: "Trust & Safety",
    links: [
      { key: "verify", label: "Verification Centre" },
      { key: "safety", label: "Safety & Reporting" },
      { key: "legal-verification", label: "Verification Policy" },
      { key: "legal-safety", label: "Safety Policy" },
    ],
  },
  {
    section: "Privacy & Legal",
    links: [
      { key: "legal-terms", label: "Terms & Conditions" },
      { key: "legal-privacy", label: "Privacy Policy" },
      { key: "legal-community", label: "Community Eligibility" },
      { key: "legal-matrimonial", label: "Matrimonial-Only Policy" },
      { key: "legal-cookie", label: "Cookie Policy" },
      { key: "legal-retention", label: "Data Retention" },
      { key: "legal-deletion", label: "Account Deletion" },
      { key: "legal-reporting", label: "Reporting & Appeals" },
    ],
  },
];

export function Footer() {
  const { setView } = useNav();

  return (
    <footer className="mt-auto border-t" style={{ borderColor: "rgba(214, 183, 122, 0.25)", background: "var(--navy)" }}>
      <div className="text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg viewBox="0 0 36 36" className="h-8 w-8">
                  <defs>
                    <linearGradient id="footerGold" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E8D9B5" />
                      <stop offset="100%" stopColor="#B8964A" />
                    </linearGradient>
                  </defs>
                  <circle cx="14" cy="18" r="8" fill="none" stroke="url(#footerGold)" strokeWidth="2.5" />
                  <circle cx="22" cy="18" r="8" fill="none" stroke="url(#footerGold)" strokeWidth="2.5" />
                </svg>
                <span className="font-serif text-xl font-semibold">GarMinas</span>
              </div>
              <p className="font-serif italic text-sm text-white/70 mb-4">
                A Connection That Leads to Forever.
              </p>
              <p className="text-xs text-white/50 leading-relaxed">
                An exclusive matrimonial community for adult Ismailis connected to Gilgit-Baltistan.
              </p>
            </div>
            {FOOTER_LINKS.map((col) => (
              <div key={col.section}>
                <h4 className="font-serif text-sm font-semibold text-white/90 mb-3">{col.section}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.key}>
                      <button
                        onClick={() => setView(link.key)}
                        className="text-xs text-white/60 hover:text-white transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/50">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" /> Verification required
              </span>
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" /> Privacy-first
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" /> Matrimonial-only
              </span>
            </div>
            <p className="text-[11px] text-white/40">
              © {new Date().getFullYear()} GarMinas. All rights reserved.
              <br />
              GarMinas facilitates introductions; it does not guarantee marriage, compatibility, identity beyond the stated verification level, or the conduct of members.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
