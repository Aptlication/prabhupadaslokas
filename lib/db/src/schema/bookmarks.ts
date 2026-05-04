import { integer, pgTable, serial, timestamp, text, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "./users";

export const slokaBookmarksTable = pgTable(
  "sloka_bookmarks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    slokaId: text("sloka_id").notNull(),
    savedAt: timestamp("saved_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.slokaId)],
);

export const insertSlokaBookmarkSchema = createInsertSchema(slokaBookmarksTable).omit({
  id: true,
  savedAt: true,
});
export type InsertSlokaBookmark = z.infer<typeof insertSlokaBookmarkSchema>;
export type SlokaBookmark = typeof slokaBookmarksTable.$inferSelect;
