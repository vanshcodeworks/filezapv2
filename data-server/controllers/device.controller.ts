import type { Request, Response } from "express"
import User from "../models/user.model"
import { hashOwnerKey } from "../utils/hash"

export async function upsertDevice(req: Request, res: Response) {
  try {
    const { uniqueId, ownerKey } = req.body as { uniqueId?: string; ownerKey?: string }

    if (!uniqueId || !ownerKey) {
      return res.status(400).json({ message: "uniqueId and ownerKey are required" })
    }
    if (ownerKey.length < 32) {
      return res.status(400).json({ message: "ownerKey too short" })
    }

    const ownerKeyHash = hashOwnerKey(ownerKey)
    const existing = await User.findOne({ uniqueId });

if (!existing) {
  await User.create({ uniqueId, ownerKeyHash, usedBytes: 0, activeFiles: 0 });
  return res.json({ ok: true, uniqueId });
}

// existing user: verify same key, do NOT rotate silently
if (!existing.ownerKeyHash) {
  existing.ownerKeyHash = ownerKeyHash;
  await existing.save();
  return res.json({ ok: true, uniqueId });
}

if (existing.ownerKeyHash !== ownerKeyHash) {
  return res.status(403).json({ message: "Device ownership mismatch" });
}

return res.json({ ok: true, uniqueId });
  } catch (err) {
    return res.status(500).json({ message: "Failed to upsert device" })
  }
}