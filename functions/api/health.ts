// functions/api/health.ts — P0 smoke test for the backend tier.
//
// GET /api/health  ->  { ok: true, db: "up" | "down", time: "..." }
//
// This is intentionally UNAUTHENTICATED so you can confirm Pages Functions +
// the D1 binding work before wiring Access in front of the rest of /api/*.
// (The deny-by-default _middleware allowlists this one path — see _middleware.ts.)

import { ping } from "../_lib/db";

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let db: "up" | "down" = "down";
  try {
    await ping(env.DB);
    db = "up";
  } catch {
    db = "down";
  }

  return Response.json(
    { ok: db === "up", db, time: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
};
