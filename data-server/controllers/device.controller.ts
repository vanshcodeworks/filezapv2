import type { Request, Response } from "express";
import User from "../models/user.model";
import { hashOwnerKey, verifyOwnerKey } from "../utils/hash";

export async function upsertDevice(req: Request, res: Response) {
  try {
    const { uniqueId, ownerKey } = req.body as {
      uniqueId?: string;
      ownerKey?: string;
    };

    if (!uniqueId || typeof uniqueId !== "string" || uniqueId.trim().length < 8) {
      return res.status(400).json({ message: "uniqueId must be 8+ chars" });
    }
    if (!ownerKey || typeof ownerKey !== "string" || ownerKey.trim().length < 16) {
      return res.status(400).json({ message: "ownerKey must be 16+ chars" });
    }

    const existing = await User.findOne({ uniqueId });

    if (!existing) {
      const ownerKeyHash = await hashOwnerKey(ownerKey);
      await User.create({
        uniqueId,
        ownerKeyHash,
        usedBytes: 0,
        activeFiles: 0,
      });
      return res.json({ ok: true });
    }

    // existing user — verify key, never overwrite
    if (!existing.ownerKeyHash) {
      existing.ownerKeyHash = await hashOwnerKey(ownerKey);
      await existing.save();
      return res.json({ ok: true });
    }

    const valid = await verifyOwnerKey(ownerKey, existing.ownerKeyHash);
    if (!valid) {
      return res.status(403).json({ message: "Device ownership mismatch" });
    }

    return res.json({ ok: true });
  } catch (err: any) {
    // THIS will now print the REAL error in Render logs
    console.error("[upsertDevice] error:", err?.message || err);
    return res.status(500).json({ message: "Internal server error" });
  }
}