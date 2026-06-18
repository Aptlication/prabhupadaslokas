// functions/_lib/db.ts — the ONLY place that talks to D1.
//
// Isolation rule (D1 has no row-level security, so this layer IS the security):
//   * Every accessor takes a server-built scope (userId / groupId) derived from
//     the verified Access JWT — never from client input.
//   * No route handler may call env.DB.prepare directly. The CI guard
//     (see tests/) fails the build if `prepare(` appears outside this file.

export interface Scope {
  userId: string;
}

/** Liveness probe for /api/health — the only unscoped read, kept here so the
 *  "no raw SQL outside this file" guard stays absolute. */
export async function ping(db: D1Database): Promise<boolean> {
  await db.prepare("SELECT 1").first();
  return true;
}

// ── Personal data (scoped by user_id) ───────────────────────────────────────

export interface ProgressRow {
  sloka_id: string;
  state: string;
  updated_at: string;
}

export async function listProgress(
  db: D1Database,
  scope: Scope,
): Promise<ProgressRow[]> {
  const { results } = await db
    .prepare(
      "SELECT sloka_id, state, updated_at FROM progress WHERE user_id = ?1 ORDER BY updated_at DESC",
    )
    .bind(scope.userId)
    .all<ProgressRow>();
  return results ?? [];
}

export async function upsertProgress(
  db: D1Database,
  scope: Scope,
  slokaId: string,
  state: string,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO progress (id, user_id, sloka_id, state, updated_at) " +
        "VALUES (?1, ?2, ?3, ?4, datetime('now')) " +
        "ON CONFLICT(user_id, sloka_id) DO UPDATE SET " +
        "state = excluded.state, updated_at = excluded.updated_at",
    )
    .bind(crypto.randomUUID(), scope.userId, slokaId, state)
    .run();
}

// ── Group data (scoped by group_id + a VERIFIED membership) ──────────────────

type Role = "owner" | "teacher" | "student";
const RANK: Record<Role, number> = { student: 0, teacher: 1, owner: 2 };

/**
 * Throws (→ caller returns 403) unless `userId` is a member of `groupId` with at
 * least `minRole`. Call this BEFORE any group-scoped query.
 */
export async function requireMembership(
  db: D1Database,
  userId: string,
  groupId: string,
  minRole: Role = "student",
): Promise<Role> {
  const row = await db
    .prepare("SELECT role FROM memberships WHERE group_id = ?1 AND user_id = ?2")
    .bind(groupId, userId)
    .first<{ role: Role }>();

  if (!row || RANK[row.role] < RANK[minRole]) {
    throw new ForbiddenError("not a member of this group with sufficient role");
  }
  return row.role;
}

export class ForbiddenError extends Error {}
