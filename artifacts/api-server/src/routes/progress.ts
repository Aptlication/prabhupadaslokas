import { slokaProgressTable, usersTable, type Database } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Hono } from "hono";

import { withDb } from "../db";
import { requireAuth } from "../middlewares/requireAuth";
import type { AppEnv } from "../types";

const progress = new Hono<AppEnv>();
progress.use("*", requireAuth, withDb);

async function getDbUserId(db: Database, clerkUserId: string): Promise<number | null> {
  const rows = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0]?.id ?? null;
}

progress.get("/", async (c) => {
  const db = c.get("db");
  const userId = await getDbUserId(db, c.get("clerkUserId"));
  if (!userId) return c.json([]);

  const rows = await db
    .select()
    .from(slokaProgressTable)
    .where(eq(slokaProgressTable.userId, userId));
  return c.json(rows);
});

progress.put("/:slokaId", async (c) => {
  const slokaId = String(c.req.param("slokaId"));
  const { status } = await c.req
    .json<{ status?: string }>()
    .catch(() => ({ status: undefined }));

  if (!status || !["unstarted", "learning", "learned"].includes(status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const db = c.get("db");
  const userId = await getDbUserId(db, c.get("clerkUserId"));
  if (!userId) return c.json({ error: "User not found" }, 404);

  try {
    const [row] = await db
      .insert(slokaProgressTable)
      .values({ userId, slokaId, status })
      .onConflictDoUpdate({
        target: [slokaProgressTable.userId, slokaProgressTable.slokaId],
        set: { status, updatedAt: new Date() },
      })
      .returning();
    return c.json(row);
  } catch (err) {
    console.error("progress update error", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default progress;
