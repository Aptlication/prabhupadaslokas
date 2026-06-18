// functions/_lib/auth.ts — Cloudflare Access JWT verification + JIT user provisioning.
//
// Files/dirs starting with "_" are NOT routed by Pages, so this is a shared lib.
//
// Dependency: `jose` (JWKS + JWT verification). Add it to the app package:
//   cd artifacts/sloka-hub && pnpm add jose
// (Pages Functions bundle node_modules at build time.)

import { createRemoteJWKSet, jwtVerify } from "jose";

export interface AuthContext {
  userId: string;     // internal users.id (uuid)
  sub: string;        // Access JWT subject
  email: string | null;
}

interface Env {
  DB: D1Database;
  ACCESS_TEAM_DOMAIN: string; // e.g. "yourteam.cloudflareaccess.com"
  ACCESS_AUD: string;         // Access application AUD tag
}

// Cache the JWKS per isolate so we don't refetch on every request.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks(teamDomain: string) {
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://${teamDomain}/cdn-cgi/access/certs`),
    );
  }
  return jwks;
}

/**
 * Verify the Access JWT on the request and resolve it to an internal user.
 * Returns null when the token is missing or invalid (caller must 401).
 * Identity comes ONLY from the verified token — never from request body/query.
 */
export async function authenticate(
  request: Request,
  env: Env,
): Promise<AuthContext | null> {
  const token =
    request.headers.get("Cf-Access-Jwt-Assertion") ??
    // cookie fallback (Access also sets CF_Authorization)
    (request.headers.get("Cookie")?.match(/CF_Authorization=([^;]+)/)?.[1] ?? null);

  if (!token) return null;

  let sub: string;
  let email: string | null;
  try {
    const { payload } = await jwtVerify(token, getJwks(env.ACCESS_TEAM_DOMAIN), {
      issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
      audience: env.ACCESS_AUD,
    });
    sub = String(payload.sub);
    email = typeof payload.email === "string" ? payload.email : null;
    if (!sub) return null;
  } catch {
    return null; // signature/aud/expiry failure -> treat as unauthenticated
  }

  const userId = await upsertUser(env.DB, sub, email);
  return { userId, sub, email };
}

/** Just-in-time provisioning: ensure a users row exists for this Access subject. */
async function upsertUser(
  db: D1Database,
  sub: string,
  email: string | null,
): Promise<string> {
  const existing = await db
    .prepare("SELECT id FROM users WHERE access_sub = ?1")
    .bind(sub)
    .first<{ id: string }>();
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO users (id, access_sub, email) VALUES (?1, ?2, ?3) " +
        "ON CONFLICT(access_sub) DO UPDATE SET email = excluded.email",
    )
    .bind(id, sub, email)
    .run();

  // Re-read in case a concurrent request created it first.
  const row = await db
    .prepare("SELECT id FROM users WHERE access_sub = ?1")
    .bind(sub)
    .first<{ id: string }>();
  return row!.id;
}
