import { Router } from "express";
import { requireOwner } from "../midlewares/requireOwner.middleware";
import { rateLimit, deviceKey } from "../midlewares/rateLimit.middleware";
import { shareByEmail } from "../controllers/share.controller";

const router = Router();

router.post(
  "/email/:shortCode",
  rateLimit({ key: (r) => `share-email:${deviceKey(r)}`, limit: 10, windowMs: 60_000 }),
  requireOwner,
  shareByEmail
);

export default router;