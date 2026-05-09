import { db, slokaBookmarksTable, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth.js";

const router = Router();

async function getDbUserId(clerkUserId: string): Promise<number | null> {
  const rows = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  return rows[0]?.id ?? null;
}

router.get("/", requireAuth, async (req, res) => {
  const { clerkUserId } = req as AuthedRequest;
  const userId = await getDbUserId(clerkUserId);
  if (!userId) { res.json([]); return; }

  const rows = await db
    .select()
    .from(slokaBookmarksTable)
    .where(eq(slokaBookmarksTable.userId, userId));
  res.json(rows);
});

router.post("/:slokaId", requireAuth, async (req, res) => {
  const { clerkUserId } = req as AuthedRequest;
  const slokaId = String(req.params.slokaId);

  const userId = await getDbUserId(clerkUserId);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  try {
    const [row] = await db
      .insert(slokaBookmarksTable)
      .values({ userId, slokaId })
      .onConflictDoNothing()
      .returning();
    res.status(201).json(row ?? { userId, slokaId });
  } catch (err) {
    req.log.error({ err }, "bookmark add error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:slokaId", requireAuth, async (req, res) => {
  const { clerkUserId } = req as AuthedRequest;
  const slokaId = String(req.params.slokaId);

  const userId = await getDbUserId(clerkUserId);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  await db
    .delete(slokaBookmarksTable)
    .where(
      and(
        eq(slokaBookmarksTable.userId, userId),
        eq(slokaBookmarksTable.slokaId, slokaId),
      ),
    );
  res.status(204).send();
});

export default router;
