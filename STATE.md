# STATE — Prabhupada Slokas (sloka-hub)

**Re-read this at the start of every session.** Canonical repo: `code/prabhupadaslokas`
(the OneDrive "Prabhupada Slokas" folder is a stale snapshot — not canonical).
_Last updated: 2026-06-25 (read-only launch shipped)._

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
- **Backend = PHASE 2 only** (accounts/sync). When built it targets **Cloudflare
  Workers (Hono) + `@clerk/backend` + `drizzle-orm/neon-http` + Neon**. Never
  Replit, never a generic Node host. Schema files don't change; only the DB driver
  and auth adapter do. The read-only launch needs NO backend.
- **Auth:** Clerk instance `verified-squid-2`; frontend publishable key wired.
  Accounts are deferred — do NOT gate launch on auth.

## Current status (2026-06-25)
- **Frontend:** Expo PWA live on Cloudflare Pages (`prabhupadaslokas.com`), branch
  `pwa-cloudflare`. Ships the 180 verses on-device; reading works with no backend.
- **Clerk gate is INERT on production:** the publishable key is NOT in the Pages
  build env, so `isClerkConfigured=false` and the app is ungated. Do NOT add
  `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` or `EXPO_PUBLIC_API_URL` to Pages env until the
  Workers backend exists (Phase 2) — doing so would turn on Clerk + sync against a
  backend that isn't built.
- **Neon DB (`neondb`):** provisioned. `users` / `sloka_progress` / `sloka_bookmarks`
  created (empty); `slokas` seeded with exactly **180** canonical rows (verified).
- **✅ READ-ONLY LAUNCH SHIPPED (commit `e3e3e1e`):** the Cloudflare Access save-gate
  is removed. Web "mark learned" / "My Slokas" now save on-device (AsyncStorage) with
  no prompt, no identity check, no `/api/*` sync — web matches native. Verified on the
  live bundle: no `cdn-cgi/access` / `get-identity` / `/api/login` / "Sign in to save"
  strings, no Clerk key inlined (ungated). `lib/api.ts` (the Access client) deleted.

## Branches
- `pwa-cloudflare` — **production / live**. Has `clerk-auth` (full-gate Clerk, inert)
  merged. Still contains the Cloudflare Access save-gating (the launch gap above).
- `clerk-clean-switch` (pushed, PR open) — **Phase 2**: browse-open Clerk + backend
  sync via `lib/api → ${EXPO_PUBLIC_API_URL}/api`. Removes the Cloudflare Access code.
  Do NOT merge for launch as-is (it's the accounts/sync path).
- `clerk-auth` — merged into `pwa-cloudflare`.

## Next actions
1. ~~LAUNCH: remove the Cloudflare Access save-prompt~~ — **DONE** (commit `e3e3e1e`,
   live on `prabhupadaslokas.com`).
2. **Phase 0–1 (mostly done):** Neon provisioned + schema + 180 slokas seeded.
   Remaining (Phase-2 prerequisite): move DNS Namecheap → Cloudflare for `api.<domain>`.
3. **Phase 2 (deferred):** port `api-server` → Cloudflare Worker (Hono + `@clerk/backend`
   + `neon-http`); `wrangler secret` for `DATABASE_URL` (Neon) + `CLERK_*`; bind
   `api.<domain>`; set `EXPO_PUBLIC_API_URL` in Pages env; then enable Clerk.
4. **Decommission:** delete the Replit deployment + Replit DB if any remnants exist.
