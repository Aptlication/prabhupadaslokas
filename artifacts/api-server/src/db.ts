import { createDb } from "@workspace/db";
import type { MiddlewareHandler } from "hono";

import type { AppEnv } from "./types";

/**
 * Per-request DB middleware. Opens a node-postgres connection through the
 * Hyperdrive binding, exposes a Drizzle client as `c.var.db`, and closes the
 * connection after the response is sent. Apply only to routes that hit the DB
 * (not /healthz) so liveness never depends on Postgres.
 */
export const withDb: MiddlewareHandler<AppEnv> = async (c, next) => {
  const { client, db } = createDb(c.env.HYPERDRIVE.connectionString);
  await client.connect();
  c.set("db", db);
  try {
    await next();
  } finally {
    c.executionCtx.waitUntil(client.end());
  }
};
