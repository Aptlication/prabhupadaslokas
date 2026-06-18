// functions/api/progress.ts — example user-scoped endpoint (P2).
//
//   GET  /api/progress           -> this user's progress rows
//   POST /api/progress {slokaId, state} -> upsert one row for this user
//
// Identity comes from ctx.data.auth (set by _middleware after JWT verification).
// The handler never reads user_id from the request — it can only ever touch its
// own rows, because the scope is the verified userId.

import type { AuthContext } from "../_lib/auth";
import { listProgress, upsertProgress } from "../_lib/db";

interface Env {
  DB: D1Database;
}
type Data = { auth: AuthContext };

const VALID_STATES = new Set(["new", "learning", "memorized"]);

export const onRequestGet: PagesFunction<Env, string, Data> = async (ctx) => {
  const rows = await listProgress(ctx.env.DB, { userId: ctx.data.auth.userId });
  return Response.json({ progress: rows }, { headers: { "cache-control": "no-store" } });
};

export const onRequestPost: PagesFunction<Env, string, Data> = async (ctx) => {
  let body: { slokaId?: unknown; state?: unknown };
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const slokaId = typeof body.slokaId === "string" ? body.slokaId : "";
  const state = typeof body.state === "string" ? body.state : "";
  if (!slokaId || !VALID_STATES.has(state)) {
    return Response.json({ error: "slokaId and a valid state are required" }, { status: 400 });
  }

  await upsertProgress(ctx.env.DB, { userId: ctx.data.auth.userId }, slokaId, state);
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
};
