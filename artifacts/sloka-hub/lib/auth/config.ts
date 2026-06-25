/**
 * Auth configuration, read from build-time public env vars.
 *
 *   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY  (required)  — Clerk frontend key.
 *   EXPO_PUBLIC_API_URL                (optional)  — base URL of the api-server.
 *       When set, the app upserts the signed-in user via POST {API_URL}/api/auth/sync.
 *       When unset (current local-only PWA), sign-in still works; sync is skipped.
 *
 * Env vars prefixed EXPO_PUBLIC_ are inlined by Expo at build time and are the
 * supported way to ship public config to the client.
 */
export const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/**
 * A real Clerk publishable key is `pk_test_`/`pk_live_` followed by the
 * base64-encoded Frontend API host (which decodes to a string ending in `$`).
 * We validate that shape so a blank value OR an obvious placeholder like
 * `pk_test_xxxxx` cleanly falls back to the ungated app instead of crashing
 * inside ClerkProvider with "invalid publishableKey".
 */
function looksLikeValidClerkKey(key: string): boolean {
  const m = /^pk_(test|live)_(.+)$/.exec(key);
  if (!m) return false;
  const body = m[2];
  try {
    const decode =
      typeof atob === "function"
        ? atob
        : (s: string) => {
            // Node fallback when atob is unavailable. Typed via globalThis so
            // this client package needs no @types/node; if Buffer is absent at
            // runtime this throws and the catch below applies the length check.
            const buf = (
              globalThis as {
                Buffer?: {
                  from(d: string, e: string): { toString(e: string): string };
                };
              }
            ).Buffer;
            if (!buf) throw new Error("no base64 decoder");
            return buf.from(s, "base64").toString("utf8");
          };
    return decode(body).endsWith("$");
  } catch {
    // Can't decode (no atob/Buffer) — accept only if it's plausibly long.
    return body.length >= 16;
  }
}

export const isClerkConfigured = looksLikeValidClerkKey(CLERK_PUBLISHABLE_KEY);
