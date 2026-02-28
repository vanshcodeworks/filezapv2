import { Router } from "express";
import { initUpload, completeUpload } from "../controllers/upload.controller";
import { requireOwner } from "../midlewares/requireOwner.middleware";
import { rateLimit, ipKey, deviceKey } from "../midlewares/rateLimit.middleware";

const router = Router();

router.post(
  "/init",
  rateLimit({ key: (r) => `upl:ip:${ipKey(r)}`,  limit: 20, windowMs: 60_000 }),
  rateLimit({ key: (r) => `upl:dv:${deviceKey(r)}`, limit: 10, windowMs: 60_000 }),
  requireOwner,
  initUpload
);

router.post(
  "/complete",
  rateLimit({ key: (r) => `cmp:dv:${deviceKey(r)}`, limit: 20, windowMs: 60_000 }),
  requireOwner,
  completeUpload
);

export default router;