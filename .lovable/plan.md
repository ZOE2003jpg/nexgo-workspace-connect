# NexGo: Branding + Feature Expansion Plan

Because this touches branding, DB schema, multiple roles, and new modules, I'll break it into phases. I recommend approving Phase 1 + 2 first (visible immediately), then we tackle backend-heavy phases sequentially so each can be tested.

---

## Phase 1 — Branding & Theme (ship first)

1. **Logos**
   - Save the full horizontal `NG nexgo` logo (image 3, dark bg) as `src/assets/nexgo-logo-full-dark.png`
   - Save the wordmark `nexgo` (image 2, light bg) as `src/assets/nexgo-logo-full-light.png`
   - Save the `NG` mark (image 1) as `public/favicon.png` (used for favicon + small avatars)
   - Replace existing `src/assets/nexgo-logo.png` usages with a `<Logo />` component that swaps based on theme
   - Update `<head>` favicon link in `__root.tsx`

2. **Light + Dark mode**
   - Light is **default**
   - Add `ThemeProvider` (class strategy on `<html>`, persisted in `localStorage`)
   - Define both palettes in `src/styles.css` (`:root` = light, `.dark` = dark) using oklch tokens — keep the existing gold accent
   - Add a theme toggle button in the top nav / profile screen

## Phase 2 — Vendor categories expansion

- Add `category` column to `restaurants` (rename concept to "vendors" in UI): `food | market | supermarket | retail | container`
- Update vendor signup + vendor dashboard to pick a category and upload product catalog (reuse `menu_items` table, generalize labels to "Products")
- Filter the student storefront by category tabs

## Phase 3 — Pickup ID system (unifies food + package + trip)

- Add `pickup_code` (unique, human-readable like `NX-7H29K`) to `orders` and `dispatches`
- DB function `generate_pickup_code()` + trigger on insert
- Visibility rules via RLS:
  - Student (owner) can read
  - Vendor (restaurant owner) can read
  - Rider **cannot** see it — rider enters it manually to confirm delivery
- New server fn `confirm_pickup(pickup_code)` for riders: validates, returns minimal student info (name + drop-off address only — no phone/email), marks order `delivered`
- Replace current OTP UI with pickup-code UI

## Phase 4 — Rider onboarding & document approval

- New table `rider_documents` (rider_id, doc_type, file_url, status: pending/approved/rejected, reviewer_id)
- New storage bucket `rider-docs` (private)
- Rider can't accept orders until `riders.approved = true` (add column to a new `rider_profiles` table)
- Admin panel: review queue with approve/reject

## Phase 5 — Travel logistics: private vs public

- Add `vehicle_type` (`private | public`) and separate `price_private`, `price_public` to `trip_routes`
- Update NexTrip UI to show both options with prices side-by-side
- Students cannot pick a specific rider — system auto-assigns (already the case; lock the UI)

## Phase 6 — Notifications

- New `notifications` table (user_id, type, title, body, data jsonb, read_at)
- Triggers: on new order → notify vendor (include delivery address); on new dispatch → notify (include pickup + dropoff)
- Bell icon + dropdown in top nav with realtime subscription

## Phase 7 — Chat + Call

- `conversations` + `messages` tables scoped to an order/dispatch
- Realtime chat between student ↔ rider (only while order is active)
- "Call" button = `tel:` link to rider's masked number (we'll add a `phone` field to profiles)

## Phase 8 — Newsletter automation

- `newsletter_subscribers` table (auto-add on signup, opt-out flag)
- Admin "Compose newsletter" screen → edge function sends via Resend (needs `RESEND_API_KEY`)
- Scheduled weekly digest via pg_cron hitting `/api/public/newsletter-cron`

## Phase 9 — School Panel (read-only)

- New role `school` in `app_role` enum
- New route `/app` branch rendering `SchoolApp` with dashboards (orders count, active riders, vendor list) — all SELECT only, no mutations exposed
- RLS: school role gets SELECT on aggregated views, no INSERT/UPDATE/DELETE

---

## Technical notes

- **Stack**: TanStack Start + Lovable Cloud (Supabase). All server logic via `createServerFn` + Postgres functions; no Supabase Edge Functions except for outbound email (Resend).
- **Secrets needed later**: `RESEND_API_KEY` (Phase 8). I'll prompt when we get there.
- **Migrations**: each phase is one migration so you can review and approve incrementally.
- **No breaking changes** to existing data — only additive columns + new tables.

---

## What I'll do right now if you approve

Just **Phase 1 + Phase 2** (branding, theme toggle, vendor categories). That's a meaningful, testable slice. Then we go phase by phase.

Reply **"go"** to start, or tell me to reorder / drop / expand any phase.