import type { Hyperdrive } from "@cloudflare/workers-types";
import type { Database } from "@workspace/db";

/**
 * Hono generics for the Worker: Cloudflare bindings + per-request variables.
 *
 * Bindings:
 *  - HYPERDRIVE: Cloudflare Hyperdrive binding fronting the Neon Postgres DB.
 *    `DATABASE_URL` is no longer used — the connection string comes from here.
 *  - CLERK_SECRET_KEY / CLERK_PUBLISHABLE_KEY: set via `wrangler secret put`.
 */
export type AppEnv = {
  Bindings: {
    HYPERDRIVE: Hyperdrive;
    CLERK_SECRET_KEY: string;
    CLERK_PUBLISHABLE_KEY: string;
  };
  Variables: {
    clerkUserId: string;
    db: Database;
  };
};
