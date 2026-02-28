import { Router } from "express";
import { download , unlockDownload } from "../controllers/download.controller";
import { rateLimit, ipKey } from "../midlewares/rateLimit.middleware";

const router = Router();

router.get(
  "/:shortCode",
  rateLimit({ key: (r) => `dl:ip:${ipKey(r)}`, limit: 120, windowMs: 60_000 }),
  download
);


router.post(
  "/:shortCode/unlock",
  rateLimit({ key: (r) => `unlock:${ipKey(r)}:${r.params.shortCode}`, limit: 10, windowMs: 60_000 }),
  unlockDownload
)

export default router;