// functions/api/progress.ts — set learning status for one sloka (user-scoped).
//   POST /api/progress { slokaId, status }   status ∈ unstarted|learning|learned

import type { AuthContext } from "../_lib/auth";
import { upsertProgress, type Status } from "../_lib/db";

interface Env { DB: D1Database }
type Data = { auth: AuthContext };

const VALID: ReadonlySet<Status> = new Set(["unstarted", "learning", "learned"]);

export const onRequestPost: PagesFunction<Env, string, Data> = async (ctx) => {
  let body: { slokaId?: unknown; status?: unknown };
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const slokaId = typeof body.slokaId === "string" ? body.slokaId : "";
  const status = body.status as Status;
  if (!slokaId || !VALID.has(status)) {
    return Response.json({ error: "slokaId and a valid status are required" }, { status: 400 });
  }

  await upsertProgress(ctx.env.DB, { userId: ctx.data.auth.userId }, slokaId, status);
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
};
