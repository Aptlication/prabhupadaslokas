import { getAuth } from "@clerk/express";
import { type NextFunction, type Request, type Response } from "express";

export interface AuthedRequest extends Request {
  clerkUserId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthedRequest).clerkUserId = userId;
  next();
}
