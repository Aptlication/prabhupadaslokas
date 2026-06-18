// scripts/check-no-raw-sql.mjs — CI guard for the isolation invariant.
//
// Fails the build if `.prepare(` / `.exec(` appears in any Function OUTSIDE the
// single sanctioned data-access layer (functions/_lib/db.ts) and the auth lib
// (functions/_lib/auth.ts, which legitimately reads/writes the users table).
//
// Run in CI:  node scripts/check-no-raw-sql.mjs
//
// Rationale: D1 has no row-level security, so isolation depends on every query
// being scoped in one reviewed place. This guard makes "someone wrote a raw
// unscoped query in a handler" a build failure rather than a data leak.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "functions";
const ALLOW = new Set([
  join("functions", "_lib", "db.ts"),
  join("functions", "_lib", "auth.ts"),
]);
const PATTERN = /\.(prepare|exec)\s*\(/;

/** @param {string} dir */
function walk(dir) {
  /** @type {string[]} */
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".ts") || p.endsWith(".js")) out.push(p);
  }
  return out;
}

const offenders = walk(ROOT)
  .filter((f) => !ALLOW.has(f))
  .filter((f) => PATTERN.test(readFileSync(f, "utf8")));

if (offenders.length) {
  console.error("✗ Raw D1 query found outside functions/_lib/db.ts:");
  for (const f of offenders) console.error("  - " + f);
  console.error(
    "\nMove the query into functions/_lib/db.ts and scope it by userId / a verified membership.",
  );
  process.exit(1);
}
console.log("✓ No raw D1 queries outside the data-access layer.");
