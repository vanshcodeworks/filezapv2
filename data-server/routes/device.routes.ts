import { Router } from "express";
import { upsertDevice } from "../controllers/device.controller";
import { rateLimit, ipKey } from "../midlewares/rateLimit.middleware";

const router = Router();

router.post(
  "/upsert",
  rateLimit({ key: (r) => `dev:ip:${ipKey(r)}`, limit: 10, windowMs: 60_000 }),
  upsertDevice
);

export default router;