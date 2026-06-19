// functions/api/favorites.ts — toggle "My Slokas" for one sloka (user-scoped).
//   POST /api/favorites { slokaId, inMySlokas: boolean }

import type { AuthContext } from "../_lib/auth";
import { setFavorite } from "../_lib/db";

interface Env { DB: D1Database }
type Data = { auth: AuthContext };

export const onRequestPost: PagesFunction<Env, string, Data> = async (ctx) => {
  let body: { slokaId?: unknown; inMySlokas?: unknown };
  try {
    body = await ctx.request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const slokaId = typeof body.slokaId === "string" ? body.slokaId : "";
  if (!slokaId || typeof body.inMySlokas !== "boolean") {
    return Response.json({ error: "slokaId and boolean inMySlokas required" }, { status: 400 });
  }

  await setFavorite(ctx.env.DB, { userId: ctx.data.auth.userId }, slokaId, body.inMySlokas);
  return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
};
