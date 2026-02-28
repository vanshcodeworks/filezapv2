import { Router } from "express";
import { listFiles, deleteFile } from "../controllers/file.controller";
import { requireOwner } from "../midlewares/requireOwner.middleware";
import { rateLimit, deviceKey } from "../midlewares/rateLimit.middleware";

const router = Router();

router.get(
  "/",
  rateLimit({ key: (r) => `lst:dv:${deviceKey(r)}`, limit: 30, windowMs: 60_000 }),
  requireOwner,
  listFiles
);

router.delete(
  "/:shortCode",
  rateLimit({ key: (r) => `del:dv:${deviceKey(r)}`, limit: 20, windowMs: 60_000 }),
  requireOwner,
  deleteFile
);

export default router;