import { db, slokaProgressTable, usersTable } from "@workspace/db";
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
    .from(slokaProgressTable)
    .where(eq(slokaProgressTable.userId, userId));
  res.json(rows);
});

router.put("/:slokaId", requireAuth, async (req, res) => {
  const { clerkUserId } = req as AuthedRequest;
  const { slokaId } = req.params;
  const { status } = req.body as { status: string };

  if (!["unstarted", "learning", "learned"].includes(status)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const userId = await getDbUserId(clerkUserId);
  if (!userId) { res.status(404).json({ error: "User not found" }); return; }

  try {
    const [row] = await db
      .insert(slokaProgressTable)
      .values({ userId, slokaId, status })
      .onConflictDoUpdate({
        target: [slokaProgressTable.userId, slokaProgressTable.slokaId],
        set: { status, updatedAt: new Date() },
      })
      .returning();
    res.json(row);
  } catch (err) {
    req.log.error({ err }, "progress update error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
