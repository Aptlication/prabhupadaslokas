// functions/api/state.ts — whole-account sync for the client.
//   GET  /api/state            -> { progress: { [slokaId]: {status,inMySlokas,savedAt} } }
//   POST /api/state {progress}  -> idempotent bulk import (first-login migration)

import type { AuthContext } from "../_lib/auth";
import { getState, importState, type StateMap, type Status } from "../_lib/db";

interface Env { DB: D1Database }
type Data = { auth: AuthContext };

const VALID: ReadonlySet<Status> = new Set(["unstarted", "learning", "learned"]);

export const onRequestGet: PagesFunction<Env, string, Data> = async (ctx) => {
  const progress = await getState(ctx.env.DB, { userId: ctx.data.auth.userId });
  return Response.json({ progress }, { headers: { "cache-control": "no-store" } });
};

export const onRequestPost: PagesFunction<Env, string, Data> = async (ctx) => {
  let body: { progress?: unknown };
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.progress || typeof body.progress !== "object") {
    return Response.json({ error: "progress object required" }, { status: 400 });
  }

  // Sanitise client input into a trusted StateMap before it reaches the DB layer.
  const clean: StateMap = {};
  for (const [slokaId, raw] of Object.entries(body.progress as Record<string, unknown>)) {
    if (typeof slokaId !== "string" || !raw || typeof raw !== "object") continue;
    const r = raw as Record<string, unknown>;
    const status = VALID.has(r.status as Status) ? (r.status as Status) : "unstarted";
    clean[slokaId] = {
      status,
      inMySlokas: r.inMySlokas === true,
      savedAt: typeof r.savedAt === "string" ? r.savedAt : null,
    };
  }

  await importState(ctx.env.DB, { userId: ctx.data.auth.userId }, clean);
  const progress = await getState(ctx.env.DB, { userId: ctx.data.auth.userId });
  return Response.json({ ok: true, progress }, { headers: { "cache-control": "no-store" } });
};
