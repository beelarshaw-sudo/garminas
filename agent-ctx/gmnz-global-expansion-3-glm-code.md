# GarMinas Global Expansion — Community Verification & Internationalization

**Task ID:** gmnz-global-expansion-3
**Agent:** glm-code
**Date:** 2026-11-08

## Summary

Updated the GarMinas matrimonial platform (Next.js 16 + TypeScript + Tailwind + shadcn/ui) to support global expansion. Five tasks completed end-to-end.

## Tasks Completed

### Task 1 — Created `src/components/garminas/views/CommunityVerificationView.tsx`
- New `"use client"` default-exported component for the Ismaili Community Verification page.
- Design: `bg-navy-gradient` background, `glass-dark` card, gold (`#D6B77A`) accents, ivory text.
- Uses shadcn/ui (Card, Button, Label, Textarea, Alert, Badge, Select) + lucide-react icons (Upload, Image, FileText, MessageSquare, ShieldCheck, CheckCircle2, Clock, XCircle, AlertCircle, Loader2) + sonner toast + framer-motion.
- Fetches `GET /api/community-verification` on mount and renders a status indicator for all 5 states: `NOT_SUBMITTED` (form), `PENDING_REVIEW` (under-review card), `VERIFIED` (green verified card), `ADDITIONAL_INFO_REQUIRED` (admin request + resubmit form), `REJECTED` (reason + resubmit form).
- Submission form with 3 options (at least one required):
  - **Option A:** Photograph in an Ismaili community setting (image upload + description textarea), `type=community_photo`
  - **Option B:** Supporting documentation (document upload + type select), `type=community_document`
  - **Option C:** Additional verification (evidence upload + written explanation textarea), `type=additional_evidence`
- Reusable `uploadFile(file, type)` helper posts to `/api/upload`, returns path; shows thumbnail/filename preview + loading spinner.
- POSTs to `/api/community-verification` with `{ photoPath, photoDescription, documentPath, documentType, additionalEvidencePath, writtenExplanation }`.
- Privacy notice + "do not be rejected if no Jamatkhana photo" reassurance included.
- No `any` types.

### Task 2 — Updated `src/components/garminas/views/RegisterView.tsx`
- Replaced `connectionToGB` field in Step 2 with international fields:
  - **Country of residence** — Select dropdown populated from `COUNTRIES` (deduplicated via `UNIQUE_COUNTRIES`).
  - **Nationality** — Select dropdown (same country list).
  - **State / Province / Region** — optional text input.
  - **Current city** — text input (kept existing).
  - **Calling code** — auto-populated when country is selected via `handleCountryChange`; shown as a prefix before the mobile number input.
- Updated `step2Valid` to validate the new required fields.
- In the registration submit body, replaced `connectionToGB` with `country`, `nationality`, `region`, `callingCode`.
- Added to Step 4 (Consent) a new checkbox for `genuineIntentionsConfirmed`: "I confirm that I am registering with genuine matrimonial intentions and that the information I provide is truthful and accurate." Added to `step4Valid` and submit body (backend already required it).
- Also globalized Step 1 Alert and CardDescription text (removed "Gilgit-Baltistan" references).
- Existing 4-step flow, document uploads, password strength meter, and all other functionality preserved.

### Task 3 — Updated `src/app/page.tsx`
- Added dynamic import for `CommunityVerificationView` (ssr: false, ViewLoader fallback).
- Added `"community-verification"` to `MEMBER_ONLY_VIEWS`.
- Added `case "community-verification": return <CommunityVerificationView />;` to the switch.

### Task 4 — Updated `src/components/garminas/Header.tsx`
- Added `{ key: "community-verification", label: "Community Verification" }` to the `ACCOUNT_NAV` array (after "Verification").

### Task 5 — Updated `src/components/garminas/HomeView.tsx`
- FAQ "Who is this platform for?": "connected to the Ismaili community of Gilgit-Baltistan" → "belong to the global Ismaili community".
- Featured profile locations globalized: "Karachi · Hunza" → "Karachi · Pakistan", "Islamabad · Gilgit" → "Toronto · Canada", "Lahore · Ghizer" → "London · United Kingdom".
- Location search dropdown globalized (Karachi, Toronto, London, Dubai, Lisbon, Nairobi).
- Added prominent "Trusted by Ismailis in 30+ countries" trust indicator pill in the hero (with Globe2 icon, framer-motion entrance).
- Footer disclaimer: "adult Ismailis connected to Gilgit-Baltistan" → "adult Ismailis worldwide".
- No "Gilgit-Baltistan" exclusive references remain. Premium visual identity, animations, and all sections preserved.

## Verification
- `bun run lint` → 0 errors, 0 warnings.
- Dev server running on port 3000 (PID 3777); `GET /` → HTTP 200; `GET /api/community-verification` → HTTP 401 (compiles & auth-gated as expected).
- Cleared corrupted `.next` turbopack cache and restarted the dev server via the init dev.sh watcher to restore a healthy compile state.

## Notes / Pre-existing observations
- The `/api/upload` route handler does not exist in the codebase, yet `RegisterView`, `SubscriptionView`, and now `CommunityVerificationView` all POST to it. This is a pre-existing gap, not introduced by this task. The views are implemented faithfully to the spec; uploads will surface an error toast at runtime until that route is added.
- `src/lib/countries.ts` contains a duplicate "United States" entry; `RegisterView` deduplicates it via a `Map` so the dropdowns render cleanly.
