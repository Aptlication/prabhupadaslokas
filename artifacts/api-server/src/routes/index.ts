import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import progressRouter from "./progress.js";
import bookmarksRouter from "./bookmarks.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/progress", progressRouter);
router.use("/bookmarks", bookmarksRouter);

export default router;
