import type { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import { hashOwnerKey, verifyOwnerKey } from "../utils/hash";

export async function requireOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const uniqueId = req.header("x-device-id");
    const ownerKey = req.header("x-owner-key");

    if (!uniqueId || !ownerKey) {
      return res.status(401).json({ message: "Missing x-device-id or x-owner-key" });
    }
    if (ownerKey.length < 32) {
      return res.status(401).json({ message: "Invalid owner key" });
    }

    let user = await User.findOne({ uniqueId });

    if (!user) {
      // first time — create and bind ownership
      const ownerKeyHash = await hashOwnerKey(ownerKey);
      user = await User.create({
        uniqueId,
        ownerKeyHash,
        usedBytes: 0,
        activeFiles: 0,
      });
    } else {
      if (!user.ownerKeyHash) {
        // bind key if somehow missing
        user.ownerKeyHash = await hashOwnerKey(ownerKey);
        await user.save();
      } else {
        // verify with bcrypt
        const valid = await verifyOwnerKey(ownerKey, user.ownerKeyHash);
        if (!valid) {
          return res.status(403).json({ message: "Not owner" });
        }
      }
    }

    (req as any).device = { uniqueId };
    next();
  } catch (err: any) {
    console.error("[requireOwner] error:", err?.message || err);
    return res.status(500).json({ message: "Owner verification failed" });
  }
}