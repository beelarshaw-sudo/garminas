# Task gmnz-subscription-2 — Subscription View + Dashboard card

## Agent
GLM Code (fullstack)

## Task scope
Add a subscription / payment page to GarMinas and surface subscription
status on the member dashboard.

## Files changed

1. `src/lib/garminas.ts` — added `"subscription"` to the `ViewKey` union
   (placed between `privacy` and `notifications`).
2. `src/components/garminas/views/SubscriptionView.tsx` (NEW) —
   `"use client"` default-exported component for the subscription / payment
   page.
3. `src/app/page.tsx` — added the dynamic import for `SubscriptionView`,
   added `"subscription"` to `MEMBER_ONLY_VIEWS` (auth gate), and added the
   `case "subscription":` branch to the view switch.
4. `src/components/garminas/Header.tsx` — added
   `{ key: "subscription", label: "Subscription" }` to `ACCOUNT_NAV` so the
   page is reachable from the user menu.
5. `src/components/garminas/views/DashboardView.tsx` — added a subscription
   status card near the top of the dashboard (after the profile-approval
   banner, before the stats grid).

## SubscriptionView behaviour
- Background `bg-navy-gradient`, cards `glass-dark` with `#D6B77A` gold
  accents and `#FAF7F0` ivory text.
- Hero + gold-gradient pricing card "Monthly Subscription — 5,000 PKR"
  with a 4-item "what's included" checklist (profile verification &
  document review, matchmaking & discovery, proposals, private messaging).
- `Alert` note: "Browsing profiles is free. Contacting members requires an
  active subscription."
- Payment form (only when subscription is not ACTIVE):
  - `Select` for payment method → BANK_TRANSFER / EASYPAISA / JAZZCASH /
    OTHER (values match the `/api/subscription/payment` Zod enum).
  - `Input` for transaction reference (min 3 chars enforced client-side).
  - File upload zone: hidden `<input type="file">` behind a dashed
    drop-style button. On select, uploads immediately via
    `fetch("/api/upload", { method: "POST", body: formData })` with
    `type: "payment_receipt"`, shows a thumbnail preview + upload status,
    and stores the returned `path`.
  - Submit button → `POST /api/subscription/payment` with
    `{ method, transactionRef, receiptPath }`. Disabled while uploading or
    until a receipt path exists.
  - On success: `toast.success` + the form is replaced by a
    "Payment submitted for verification" glass-dark card (with a
    "Submit another" button to re-open the form).
- If `subscriptionStatus === "ACTIVE"`: the form is replaced by a
  "Your subscription is active" card showing the expiry date.
- Below the form: a status + payment-history card from
  `GET /api/subscription/status` — three status tiles (Status / Plan /
  Expires) and a scrollable (`max-h-72 overflow-y-auto scrollbar-lux`)
  list of recent payments with status badges (Pending / Verified /
  Rejected).
- `framer-motion` entrance (opacity 0→1, y 12→0, 0.4s ease-out).
- `sonner` toast for all feedback. `lucide-react` icons: CreditCard,
  CheckCircle2, Clock, Upload, FileCheck2, Loader2, ShieldCheck, X.

## DashboardView behaviour
- Added `SubscriptionInfo` / `SubscriptionStatusResponse` interfaces and
  a `formatExpiry` helper.
- Fetches `GET /api/subscription/status` in the existing mount effect
  (added to the `Promise.all`) and stores `sub` / `loadingSub`.
- New `SubscriptionStatusCard` rendered near the top (after the
  profile-approval banner):
  - ACTIVE → green/gold card: "Subscription Active — expires on {date}"
    (emerald accents, CheckCircle2).
  - PENDING → gold card: "Payment under verification" (Clock) + a
    "View subscription" button → `setView("subscription")`.
  - NONE / EXPIRED / CANCELLED → rose-accent card: "Your subscription is
    not active. Pay 5,000 PKR to contact members." with an
    "Activate Subscription" button → `setView("subscription")`.
  - While loading and no `sub` yet, a minimal loading card is shown.
- New icons added to imports: `CreditCard`, `CheckCircle2`, `Clock`.

## Types
No `any` types. All API responses are typed via locally-defined
interfaces (`SubscriptionInfo`, `SubscriptionStatusResponse`,
`PaymentRecord`, `PaymentMethod`). `PaymentMethod` is a literal union
matching the backend Zod enum.

## Lint
`bun run lint` → 0 errors, 0 warnings. One initial warning
("Unused eslint-disable directive") was removed from the receipt-preview
`<img>` (the `@next/next/no-img-element` rule does not fire there).

## Dev server
`dev.log` shows the server ready on port 3000 with no compile errors;
`GET /` and `POST /api/auth/login` returning 200.
