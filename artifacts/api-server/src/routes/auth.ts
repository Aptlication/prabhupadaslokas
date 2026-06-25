import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { withDb } from "../db";
import { requireAuth } from "../middlewares/requireAuth";
import type { AppEnv } from "../types";

const auth = new Hono<AppEnv>();

auth.post("/sync", requireAuth, withDb, async (c) => {
  const clerkUserId = c.get("clerkUserId");
  const { email, displayName } = await c.req
    .json<{ email?: string; displayName?: string }>()
    .catch(() => ({}) as { email?: string; displayName?: string });

  if (!email) {
    return c.json({ error: "email is required" }, 400);
  }

  const db = c.get("db");
  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkUserId, clerkUserId))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(usersTable)
        .set({ email, displayName: displayName ?? existing[0].displayName })
        .where(eq(usersTable.clerkUserId, clerkUserId))
        .returning();
      return c.json(updated);
    } else {
      const [created] = await db
        .insert(usersTable)
        .values({ clerkUserId, email, displayName })
        .returning();
      return c.json(created, 201);
    }
  } catch (err) {
    console.error("auth sync error", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default auth;
