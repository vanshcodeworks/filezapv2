import type { Request, Response, NextFunction } from "express"
import User from "../models/user.model"
import { hashOwnerKey, safeEqualHex } from "../utils/hash"

export async function requireOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const uniqueId = req.header("x-device-id")
    const ownerKey = req.header("x-owner-key")

    if (!uniqueId || !ownerKey) {
      return res.status(401).json({ message: "Missing x-device-id or x-owner-key" })
    }
    if (ownerKey.length < 32) {
      return res.status(401).json({ message: "Invalid owner key" })
    }

    const ownerKeyHash = hashOwnerKey(ownerKey)
    let user = await User.findOne({ uniqueId })

    // First-time device: bind it now (no login, but establishes ownership)
    if (!user) {
      user = await User.create({
        uniqueId,
        ownerKeyHash,
        usedBytes: 0,
        activeFiles: 0,
      })
    } else {
      if (!user.ownerKeyHash) {
        user.ownerKeyHash = ownerKeyHash
        await user.save()
      } else if (!safeEqualHex(ownerKeyHash, user.ownerKeyHash)) {
        return res.status(403).json({ message: "Not owner" })
      }
    }

    (req as any).device = { uniqueId }
    next()
  } catch {
    return res.status(500).json({ message: "Owner verification failed" })
  }
}