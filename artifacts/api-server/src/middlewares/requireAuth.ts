import { verifyToken } from "@clerk/backend";
import type { MiddlewareHandler } from "hono";

import type { AppEnv } from "../types";

/**
 * Auth guard — identical semantics to the previous @clerk/express version:
 * verify the caller's Clerk session token and expose the Clerk user id, else
 * reject with 401. The token arrives as `Authorization: Bearer <token>` (the
 * frontend sends Clerk's `getToken()`); @clerk/backend verifies the JWT against
 * Clerk's JWKS using the secret key.
 */
export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const claims = await verifyToken(token, {
      secretKey: c.env.CLERK_SECRET_KEY,
    });
    if (!claims.sub) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    c.set("clerkUserId", claims.sub);
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
};
