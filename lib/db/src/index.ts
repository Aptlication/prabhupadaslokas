import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Client } = pg;

/**
 * Create a Drizzle client over a single node-postgres connection.
 *
 * Workers have no module-scope `process.env`, and Hyperdrive hands us a fresh
 * connection string per request, so the client is built on demand rather than
 * eagerly at import time. The caller connects the returned `client` and is
 * responsible for closing it (e.g. `ctx.waitUntil(client.end())`).
 */
export function createDb(connectionString: string) {
  const client = new Client({ connectionString });
  return { client, db: drizzle(client, { schema }) };
}

export type Database = ReturnType<typeof createDb>["db"];

export * from "./schema";
