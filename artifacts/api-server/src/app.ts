import { Hono } from "hono";
import { cors } from "hono/cors";

import auth from "./routes/auth";
import bookmarks from "./routes/bookmarks";
import health from "./routes/health";
import progress from "./routes/progress";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// CORS: allow the PWA origin with credentials. Auth is bearer-token based (not
// cookies), but credentials are enabled per the API contract.
app.use(
  "*",
  cors({
    origin: "https://prabhupadaslokas.com",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
  }),
);

// Same surface as before, mounted under /api: /api/healthz, /api/auth/sync,
// /api/progress, /api/bookmarks.
const api = new Hono<AppEnv>();
api.route("/", health);
api.route("/auth", auth);
api.route("/progress", progress);
api.route("/bookmarks", bookmarks);

app.route("/api", api);

export default app;
