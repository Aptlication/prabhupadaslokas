import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../middlewares/requireAuth.js";

const router = Router();

router.post("/sync", requireAuth, async (req, res) => {
  const { clerkUserId } = req as AuthedRequest;
  const { email, displayName } = req.body as { email: string; displayName?: string };

  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

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
      res.json(updated);
    } else {
      const [created] = await db
        .insert(usersTable)
        .values({ clerkUserId, email, displayName })
        .returning();
      res.status(201).json(created);
    }
  } catch (err) {
    req.log.error({ err }, "auth sync error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
