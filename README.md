# P3 — Frontend wired to the API (change-set)

Makes the app sync progress + "My Slokas" to the account when signed in, while
staying exactly as-is (local storage) when signed out. Files mirror repo paths,
so it's a single copy-in.

## Files

**Backend (repo root):**
- `functions/_lib/db.ts` — *replaces* — adds favorites, combined `getState`, bulk `importState`
- `functions/api/progress.ts` — *replaces* — status enum aligned to the app (`unstarted|learning|learned`)
- `functions/api/favorites.ts` — **new** — `POST /api/favorites {slokaId, inMySlokas}`
- `functions/api/state.ts` — **new** — `GET /api/state` (full sync) + `POST /api/state` (bulk import)
- `functions/api/login.ts` — **new** — gated login bounce → returns to the app authenticated

**Frontend (`artifacts/sloka-hub`):**
- `lib/api.ts` — **new** — API client + Access auth check; web-only, fails soft
- `context/AppContext.tsx` — *replaces* — hydrate local → if signed in, reconcile with cloud + write-through; exposes `auth`, `login`, `logout`
- `app/(tabs)/settings.tsx` — *replaces* — adds an ACCOUNT section (sign in/out + sync status)

## How sync behaves

- **Signed out:** unchanged — everything in AsyncStorage, no `/api/*` calls.
- **On sign-in:** cloud state is fetched; cloud wins for slokas it has, and any
  on-device-only entries are pushed up (nothing lost). Then every change writes
  through to the API in the background.
- **Native (iOS/Android):** stays local-only for now (the Account section is web-only).

## Apply it

```bash
WS="/c/Users/j_and/OneDrive/Documents/Claude/Projects/Prabhupada Slokas"
cp -r "$WS/p3-changes/." /c/Users/j_and/code/prabhupadaslokas/
cd /c/Users/j_and/code/prabhupadaslokas

# optional local guard (should print the ✓ line)
node backend-scripts/check-no-raw-sql.mjs

# 1) push to the preview branch first — confirms it BUILDS and the signed-out app still works
git checkout feat/multitenancy
git add -A && git commit -m "feat(P3): wire frontend to API (cloud sync + account UI)"
git push origin feat/multitenancy
```

Check the **preview**: it should build green, and the app should load and work
normally (you'll be "signed out" on the preview because Access only gates the
production domain — that's expected).

```bash
# 2) once preview is green, ship to production to test the signed-in flow
git checkout pwa-cloudflare
git merge feat/multitenancy
git push origin pwa-cloudflare
```

## Test on production (prabhupadaslokas.com)

1. Open the app → **Settings → ACCOUNT → Sign in** → complete the Access One-time PIN.
2. You return to the app as "Signed in". Mark a sloka **Learned** and add one to **My Slokas**.
3. Reload the page — the state should come back from the cloud.
4. Open the site in a **different browser/profile**, sign in with the same email —
   your progress should follow you. That's cross-device sync proven.

## Notes / follow-ups

- `/api/health` is still behind Access. If you want it public for uptime checks,
  add an Access **Bypass** rule for `/api/health`.
- Session expiry mid-use shows "Sync error — changes saved on this device" in
  Settings; local data is never lost.
- P4 (groups/tenancy UI) and the P5 privacy/minors review are still ahead of a
  broad launch.
