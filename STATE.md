# STATE — Prabhupada Slokas (sloka-hub)

**Re-read this at the start of every session.** Canonical repo: `code/prabhupadaslokas`
(the OneDrive "Prabhupada Slokas" folder is a stale snapshot — not canonical).
_Last updated: 2026-06-26 (prev/next nav + "Learnt" rename shipped)._

## Hard decisions — do not contradict or re-derive
- **NO REPLIT. Permanent.** Do not deploy, configure, reference, or "bring live"
  anything on Replit — no `prabhupada-api.replit.app`, no Replit Secrets, no Replit
  `DATABASE_URL`. The `.replit.app` deployment is abandoned; ignore that it shows
  "not live." If a Replit step is ever proposed, STOP — it's the stale plan.
- **Stack:** GitHub (source/CI) + Cloudflare (Pages frontend + Workers backend +
  DNS) + Namecheap (registrar; nameservers → Cloudflare) + Neon (one Postgres for
  everything — no separate content DB).
- **App:** sloka-hub (Expo). Launch scope = **read-only, no accounts, progress
  on-device**. Eventual native iOS app from the same codebase (EAS; later phase).
- **Content:** the 180 Prabhupāda favourites ONLY. The 700-verse Bhagavad-gītā was
  removed long ago — never reintroduce it. Canonical data:
  `artifacts/sloka-hub/data/pp-slokas.json`.
- **Backend = Phase 2** (accounts/sync) — now **DEPLOYED** on **Cloudflare Workers
  (Hono) + `@clerk/backend` + node-postgres (`pg`) over a Hyperdrive binding → Neon**.
  Never Replit, never a generic Node host. Schema files unchanged. The read-only
  launch needs NO backend; this only powers accounts/sync once the frontend opts in.
- **Auth:** Clerk instance `verified-squid-2`; frontend publishable key wired.
  Accounts are deferred — do NOT gate launch on auth.

## Current status (2026-06-26)
- **✅ PREV/NEXT NAVIGATION SHIPPED (My Slokas only):** the sloka detail screen
  (`app/sloka/[id].tsx`) offers prev/next **only when opened from the My Slokas
  saved list**, which passes the saved ids (in saved order) as a `list` route
  param; it walks that saved set, disabled at the ends, within the 180-set.
  Opened from the Slokas tab, search, or a direct link → no `list` → no
  prev/next. Controls are small ‹ › arrows in the header next to the verse
  reference (no bottom bar, no swipe — both removed). Each verse opens fresh
  (Purport collapses, word-by-word chips reset on prev/next).
- **✅ "LEARNT" RENAME SHIPPED (display only):** every user-facing "Learned"
  label now reads "Learnt" (detail My Progress control, Home stat, Settings
  overview, card status). The `'learned'` status value in the schema/API is
  unchanged.
- **⚠️ CLERK STILL ON DEV KEYS — production promotion pending.** Accounts/sync
  run against the `verified-squid-2` **dev** instance; promoting Clerk to
  production keys is the remaining launch gate.

- **Frontend:** Expo PWA live on Cloudflare Pages (`prabhupadaslokas.com`), branch
  `pwa-cloudflare`. Ships the 180 verses on-device; reading works with no backend.
- **✅ ACCOUNTS/SYNC LIVE (Clerk active):** `clerk-clean-switch` merged into
  `pwa-cloudflare` (merge `23557c0`); `artifacts/sloka-hub/.env.production` (committed,
  public values) inlines `EXPO_PUBLIC_API_URL=https://api.prabhupadaslokas.com` +
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` at build time (live bundle confirmed to carry
  both). Model: browse-open; sign-in (Clerk verified-squid-2) to save; progress/
  bookmarks sync to the Worker. App shell 200, FAPI reachable (won't hang). To
  revert to read-only, remove `.env.production` (the app falls back to ungated/local).
- **Neon DB (`neondb`):** provisioned. `users` / `sloka_progress` / `sloka_bookmarks`
  created (empty); `slokas` seeded with exactly **180** canonical rows (verified).
- **✅ READ-ONLY LAUNCH SHIPPED (commit `e3e3e1e`):** the Cloudflare Access save-gate
  is removed. Web "mark learned" / "My Slokas" now save on-device (AsyncStorage) with
  no prompt, no identity check, no `/api/*` sync — web matches native. `lib/api.ts`
  (the Access client) deleted.
- **✅ PHASE 2 BACKEND DEPLOYED:** Hono Worker `prabhupada-api` live at
  `https://api.prabhupadaslokas.com` (custom domain), Hyperdrive config
  `15ad30da283549b2a025b88feb4bc8fe` → Neon, secrets `CLERK_SECRET_KEY` +
  `CLERK_PUBLISHABLE_KEY` set. Verified: `/api/healthz` 200; no-token & bogus-token
  401; CORS for `https://prabhupadaslokas.com`. Four route groups (auth/sync,
  progress, bookmarks, health) ported 1:1 from Express; `clerkProxyMiddleware`
  deleted. Code on branch `phase2-api-worker` (the running Worker deploys from here).

## Branches
- `pwa-cloudflare` — **production / live frontend**. Read-only launch shipped here
  (Access save-gate removed, `e3e3e1e`). `clerk-auth` (full-gate Clerk, inert) merged.
- `phase2-api-worker` (pushed) — the **deployed** Hono Worker backend;
  `api.prabhupadaslokas.com` deploys from here. Merge into `pwa-cloudflare` to bring
  the backend source onto the trunk.
- `clerk-clean-switch` — **Phase 2 frontend**, now MERGED into `pwa-cloudflare`
  (`23557c0`); accounts-on is live. The open PR can be closed/marked merged.
- `clerk-auth` — merged into `pwa-cloudflare`.

## Next actions
1. ~~LAUNCH: remove the Cloudflare Access save-prompt~~ — **DONE** (`e3e3e1e`, live).
2. ~~Phase 0–1: Neon provisioned + schema + 180 slokas seeded~~ — **DONE**. (DNS zone
   already on Cloudflare; no Namecheap change needed.)
3. ~~Phase 2 backend: port to Worker, Hyperdrive, secrets, custom domain, deploy~~ —
   **DONE & DEPLOYED** (`api.prabhupadaslokas.com`).
4. ~~TURN ACCOUNTS ON: env vars + merge clerk-clean-switch~~ — **DONE & LIVE**
   (`.env.production` committed; merge `23557c0` deployed; live bundle carries both).
   REMAINING: a real **browser** sign-in test (sign up → `/api/auth/sync` writes the
   `users` row → progress/bookmarks sync). Confirm Clerk verified-squid-2 has
   **password + Google enabled** and `prabhupadaslokas.com` in allowed origins.
5. **Decommission:** delete the Replit deployment + Replit DB if any remnants exist.
