-- 0001_init.sql — initial multi-tenant schema for Prabhupada Slokas (Cloudflare D1 / SQLite)
--
-- Apply with Wrangler:
--   wrangler d1 migrations apply prabhupadaslokas-db            (production)
--   wrangler d1 migrations apply prabhupadaslokas-db-staging    (staging)
--
-- NOTE: D1 is SQLite — there is NO row-level security. Tenant isolation is
-- enforced entirely in the API layer (see functions/_lib/db.ts). Every scoped
-- query MUST be filtered by user_id and/or a verified group membership.

PRAGMA foreign_keys = ON;

-- ── Identity ────────────────────────────────────────────────────────────────
-- One row per authenticated person. `access_sub` is the stable subject claim
-- from the Cloudflare Access JWT — the user is ALWAYS identified by the verified
-- token, never by client-supplied input.
CREATE TABLE users (
  id          TEXT PRIMARY KEY,              -- uuid (generated server-side)
  access_sub  TEXT NOT NULL UNIQUE,          -- Access JWT `sub` claim
  email       TEXT,
  display_name TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Tenancy: groups + memberships ───────────────────────────────────────────
-- A `group` is a tenant (a temple / class / teacher space). `memberships` is the
-- many-to-many join that defines who belongs to which group and in what role.
CREATE TABLE groups (
  id            TEXT PRIMARY KEY,            -- uuid
  name          TEXT NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE memberships (
  id         TEXT PRIMARY KEY,               -- uuid
  group_id   TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('owner','teacher','student')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (group_id, user_id)
);

-- ── Personal domain data (scoped by user_id) ────────────────────────────────
CREATE TABLE progress (
  id         TEXT PRIMARY KEY,               -- uuid
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sloka_id   TEXT NOT NULL,                  -- e.g. "pp_001" from data/pp-slokas.json
  state      TEXT NOT NULL DEFAULT 'new',    -- new | learning | memorized
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, sloka_id)
);

CREATE TABLE favorites (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sloka_id  TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, sloka_id)
);

CREATE TABLE notes (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sloka_id  TEXT NOT NULL,
  body      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Group domain data (scoped by group_id + verified membership) ────────────
CREATE TABLE assignments (
  id                 TEXT PRIMARY KEY,
  group_id           TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  assigned_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  sloka_id           TEXT NOT NULL,
  due_at             TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Indexes for the hot isolation lookups ───────────────────────────────────
CREATE INDEX idx_memberships_user   ON memberships(user_id);
CREATE INDEX idx_memberships_group  ON memberships(group_id);
CREATE INDEX idx_progress_user      ON progress(user_id);
CREATE INDEX idx_favorites_user     ON favorites(user_id);
CREATE INDEX idx_notes_user         ON notes(user_id);
CREATE INDEX idx_assignments_group  ON assignments(group_id);
