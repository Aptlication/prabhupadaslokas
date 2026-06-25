import { HealthCheckResponse } from "@workspace/api-zod";
import { Hono } from "hono";

import type { AppEnv } from "../types";

const health = new Hono<AppEnv>();

health.get("/healthz", (c) => c.json(HealthCheckResponse.parse({ status: "ok" })));

export default health;
