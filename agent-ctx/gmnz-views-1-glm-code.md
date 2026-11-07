# Task gmnz-views-1 — GarMinas View Components

## Agent
GLM Code (front-end / fullstack)

## Task scope
Create 15 polished, premium, client-side React view components under
`src/components/garminas/views/` for the GarMinas matrimonial platform
(Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui).

## Files created
All files are `"use client"` default exports and live in
`src/components/garminas/views/`:

1. `RegisterView.tsx` — 3-step registration (personal → security with strength
   meter → eligibility & consent). On success displays a verification card
   with the sandbox dev OTP + emailToken, refreshes session via
   `useSession().refresh()`, and routes to `verify`.
2. `LoginView.tsx` — centered premium login card on dark navy gradient with
   demo credentials helper text and `Forgot password?` → toast("Coming soon").
3. `VerifyView.tsx` — 5 verification badge cards (email / phone / identity /
   community / profile-approved) wired to `/api/verify`, `/api/auth/send-otp`,
   `/api/auth/verify-otp`, `/api/auth/verify-email`. Shows dev OTP as helper.
4. `ProfileEditView.tsx` — 7-tab editor (Personal / Education & Profession /
   Family / Preferences / About / Photos / Visibility) with completion ring,
   save per section, photo upload via FileReader → data URL.
5. `DashboardView.tsx` — welcome header with verified badge chips and
   completion Progress, approval banner, 4 stat cards, 8 quick-link cards.
6. `FamilyView.tsx` — invite family rep form (name / relationship / email /
   phone / 3 permissions), existing reps list with Revoke, consent note.
7. `PrivacyView.tsx` — switches + RadioGroup visibility, data export Dialog,
   deactivate AlertDialog, permanent delete AlertDialog (type DELETE to
   confirm), active sessions list with log-out-all.
8. `NotificationsView.tsx` — list with type icons, time-ago, read/unread
   styling, mark-all-read, masked-body preference note.
9. `SafetyView.tsx` — report form (subject + reason select + details),
   filed-reports list, quick block form, blocked-members list with Unblock,
   emergency note.
10. `HelpView.tsx` — 6 FAQ accordion entries, support ticket form, tickets
    list with expandable responses.
11. `SuccessStoriesView.tsx` — Stories of Forever hero + grid of story cards
    from `/api/success-stories` with consent note.
12. `GuidanceView.tsx` — category tabs, article card grid, click → fetch
    `/api/guidance?slug=...` and render body in a Dialog.
13. `LegalView.tsx` — sidebar of 11 policies + content pane. Each policy has
    8–12 paragraphs (300+ words) of real policy text.
14. `AboutView.tsx` — hero + 4 sections (Why GarMinas / Trust & Privacy /
    Community-first / Genuine marriage intentions).
15. `NotFoundMemberView.tsx` — 404-style member-only page with Sign in + Home.

## Conventions applied
- `"use client"` everywhere.
- `motion.div` entrance: opacity 0 → 1, y 12 → 0, 0.4s ease-out.
- `import { toast } from "sonner"` for all feedback.
- shadcn/ui components from `@/components/ui/*` only — no new primitives.
- lucide-react icons throughout.
- Design tokens used: `text-gold-gradient`, `bg-lux-gradient`, `bg-navy-gradient`,
  `glass-dark`, `shadow-lux`, `shadow-lux-lg`, `ring-gold`, `animate-float`,
  `animate-float-slow`, `font-serif`. No indigo/blue, no childish elements.
- No `any` types. Local `MemberSession` interface defined in VerifyView and
  DashboardView to extend the store's `ClientSession` with verification fields.
- Loading states (Loader2 spinner + disabled), error states (toast + inline),
  success states (toast + navigation via `useNav().setView`).
- Demo credentials surfaced only as user-facing helper text in LoginView.

## Lint
`bun run lint` passes with 0 errors and 0 warnings after fixing:
- `LegalView.tsx`: removed an erroneous `setState` inside `useMemo`
  (set-state-in-render rule).
- `ProfileEditView.tsx`: removed an unused `eslint-disable-next-line`
  directive on the primary-photo `<img>`.

## Dev server
Verified responding on port 3000 (HTTP 200 on `/` and `/api/auth/me`),
no compile errors in `dev.log`.
