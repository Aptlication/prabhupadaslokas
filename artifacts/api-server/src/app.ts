import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Verify Clerk session tokens using the instance encoded in the env keys
// (CLERK_SECRET_KEY + CLERK_PUBLISHABLE_KEY → clerk.prabhupadaslokas.com).
// Do NOT derive the publishable key from the request host: this API is served
// from api.prabhupadaslokas.com, so host-derivation targets the non-existent
// FAPI "clerk.api.prabhupadaslokas.com" and 401s every request.
app.use(clerkMiddleware());

app.use("/api", router);

export default app;
