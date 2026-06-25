import { slokaBookmarksTable, usersTable, type Database } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";

import { withDb } from "../db";
import { requireAuth } from "../middlewares/requireAuth";
import type { AppEnv } from "../types";

const bookmarks = new Hono<AppEnv>();
bookmarks.use("*", requireAuth, withDb);

async function getDbUserId(db: Database, clerkUserId: string): Promise<number | null> {
  const rows = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0]?.id ?? null;
}

bookmarks.get("/", async (c) => {
  const db = c.get("db");
  const userId = await getDbUserId(db, c.get("clerkUserId"));
  if (!userId) return c.json([]);

  const rows = await db
    .select()
    .from(slokaBookmarksTable)
    .where(eq(slokaBookmarksTable.userId, userId));
  return c.json(rows);
});

bookmarks.post("/:slokaId", async (c) => {
  const slokaId = String(c.req.param("slokaId"));
  const db = c.get("db");
  const userId = await getDbUserId(db, c.get("clerkUserId"));
  if (!userId) return c.json({ error: "User not found" }, 404);

  try {
    const [row] = await db
      .insert(slokaBookmarksTable)
      .values({ userId, slokaId })
      .onConflictDoNothing()
      .returning();
    return c.json(row ?? { userId, slokaId }, 201);
  } catch (err) {
    console.error("bookmark add error", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

bookmarks.delete("/:slokaId", async (c) => {
  const slokaId = String(c.req.param("slokaId"));
  const db = c.get("db");
  const userId = await getDbUserId(db, c.get("clerkUserId"));
  if (!userId) return c.json({ error: "User not found" }, 404);

  await db
    .delete(slokaBookmarksTable)
    .where(
      and(
        eq(slokaBookmarksTable.userId, userId),
        eq(slokaBookmarksTable.slokaId, slokaId),
      ),
    );
  return c.body(null, 204);
});

export default bookmarks;
