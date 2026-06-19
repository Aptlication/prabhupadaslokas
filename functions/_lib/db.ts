// functions/_lib/db.ts — the ONLY place that talks to D1.
//
// Isolation rule (D1 has no row-level security, so this layer IS the security):
//   * Every accessor takes a server-built scope (userId / groupId) derived from
//     the verified Access JWT — never from client input.
//   * No route handler may call env.DB.prepare directly. The CI guard
//     (backend-scripts/check-no-raw-sql.mjs) fails the build if `prepare(`
//     appears outside this file.

export interface Scope {
  userId: string;
}

// Status values mirror the app's domain enum (context/AppContext.tsx).
export type Status = "unstarted" | "learning" | "learned";

/** Liveness probe for /api/health — the only unscoped read, kept here so the
 *  "no raw SQL outside this file" guard stays absolute. */
export async function ping(db: D1Database): Promise<boolean> {
  await db.prepare("SELECT 1").first();
  return true;
}

// ── Combined per-user state (shape matches AppContext's progress map) ─────────

export interface SlokaState {
  status: Status;
  inMySlokas: boolean;
  savedAt: string | null;
}
export type StateMap = Record<string, SlokaState>;

/** Full sync payload for one user: progress + favorites joined into the exact
 *  shape the client stores. A sloka appears if it has progress OR is favorited. */
export async function getState(db: D1Database, scope: Scope): Promise<StateMap> {
  const [prog, favs] = await db.batch<{ sloka_id: string; v: string }>([
    db.prepare("SELECT sloka_id, state AS v FROM progress WHERE user_id = ?1").bind(scope.userId),
    db.prepare("SELECT sloka_id, created_at AS v FROM favorites WHERE user_id = ?1").bind(scope.userId),
  ]);

  const map: StateMap = {};
  for (const r of prog.results ?? []) {
    map[r.sloka_id] = { status: r.v as Status, inMySlokas: false, savedAt: null };
  }
  for (const r of favs.results ?? []) {
    const e = map[r.sloka_id] ?? { status: "unstarted" as Status, inMySlokas: false, savedAt: null };
    e.inMySlokas = true;
    e.savedAt = r.v;
    map[r.sloka_id] = e;
  }
  return map;
}

// ── Progress (scoped by user_id) ─────────────────────────────────────────────

export async function upsertProgress(
  db: D1Database,
  scope: Scope,
  slokaId: string,
  status: Status,
): Promise<void> {
  await db
    .prepare(
      "INSERT INTO progress (id, user_id, sloka_id, state, updated_at) " +
        "VALUES (?1, ?2, ?3, ?4, datetime('now')) " +
        "ON CONFLICT(user_id, sloka_id) DO UPDATE SET " +
        "state = excluded.state, updated_at = excluded.updated_at",
    )
    .bind(crypto.randomUUID(), scope.userId, slokaId, status)
    .run();
}

// ── Favorites / "My Slokas" (scoped by user_id) ──────────────────────────────

export async function setFavorite(
  db: D1Database,
  scope: Scope,
  slokaId: string,
  on: boolean,
): Promise<void> {
  if (on) {
    await db
      .prepare(
        "INSERT INTO favorites (id, user_id, sloka_id) VALUES (?1, ?2, ?3) " +
          "ON CONFLICT(user_id, sloka_id) DO NOTHING",
      )
      .bind(crypto.randomUUID(), scope.userId, slokaId)
      .run();
  } else {
    await db
      .prepare("DELETE FROM favorites WHERE user_id = ?1 AND sloka_id = ?2")
      .bind(scope.userId, slokaId)
      .run();
  }
}

// ── Bulk import (first-login local→cloud migration) ──────────────────────────

/** Idempotent upsert of a whole StateMap for this user. Used once on first
 *  login to push existing on-device progress into the account. */
export async function importState(
  db: D1Database,
  scope: Scope,
  map: StateMap,
): Promise<void> {
  const stmts: D1PreparedStatement[] = [];
  for (const [slokaId, s] of Object.entries(map)) {
    if (s.status && s.status !== "unstarted") {
      stmts.push(
        db
          .prepare(
            "INSERT INTO progress (id, user_id, sloka_id, state, updated_at) " +
              "VALUES (?1, ?2, ?3, ?4, datetime('now')) " +
              "ON CONFLICT(user_id, sloka_id) DO UPDATE SET state = excluded.state",
          )
          .bind(crypto.randomUUID(), scope.userId, slokaId, s.status),
      );
    }
    if (s.inMySlokas) {
      stmts.push(
        db
          .prepare(
            "INSERT INTO favorites (id, user_id, sloka_id) VALUES (?1, ?2, ?3) " +
              "ON CONFLICT(user_id, sloka_id) DO NOTHING",
          )
          .bind(crypto.randomUUID(), scope.userId, slokaId),
      );
    }
  }
  if (stmts.length) await db.batch(stmts);
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
