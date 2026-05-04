import { integer, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "./users";

export const slokaProgressTable = pgTable(
  "sloka_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    slokaId: text("sloka_id").notNull(),
    status: text("status").notNull().default("unstarted"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.slokaId)],
);

export const insertSlokaProgressSchema = createInsertSchema(slokaProgressTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertSlokaProgress = z.infer<typeof insertSlokaProgressSchema>;
export type SlokaProgress = typeof slokaProgressTable.$inferSelect;
