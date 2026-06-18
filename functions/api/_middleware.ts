// functions/api/_middleware.ts — runs for EVERY /api/* request (deny-by-default).
//
// Pages middleware chains in directory order. This is the single choke point that
// guarantees no /api/* handler runs without a verified identity — except a small
// explicit allowlist (the unauthenticated health check).

import { authenticate, type AuthContext } from "../_lib/auth";

interface Env {
  DB: D1Database;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
}

// Paths that may be reached WITHOUT authentication. Keep this list tiny.
const PUBLIC_PATHS = new Set<string>(["/api/health"]);

export const onRequest: PagesFunction<Env, string, { auth?: AuthContext }> = async (
  ctx,
) => {
  const url = new URL(ctx.request.url);

  if (PUBLIC_PATHS.has(url.pathname)) {
    return ctx.next();
  }

  const auth = await authenticate(ctx.request, ctx.env);
  if (!auth) {
    return Response.json(
      { error: "unauthenticated" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  // Hand the verified identity to downstream handlers via ctx.data.
  ctx.data.auth = auth;
  return ctx.next();
};
