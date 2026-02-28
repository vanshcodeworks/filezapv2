import type { Request, Response } from "express";
import { getUploadUrl, headObject, deleteObject, S3_BUCKET } from "../utils/s3";
import { getShortCode } from "../utils/getShortCode";
import { LIMITS } from "../utils/limits";
import User from "../models/user.model";
import File from "../models/file.model";
import path from "path";
import { hashFilePassword } from "../utils/password";
export const BLOCKED_EXT = new Set([
  ".exe", ".msi", ".bat", ".cmd", ".ps1", ".js", ".vbs", ".scr", ".com"
]);


function safeName(name: string): string {
  return name.replace(/[^\w.\-]/g, "_").slice(0, 200);
}


export async function initUpload(req: Request, res: Response) {
  try {
    const uniqueId = (req as any).device?.uniqueId as string;
    const {
      fileName,
      sizeBytes,
      mimeType,
      ttlHours,
      passwordEnabled,
      password
    } = req.body as {
      fileName?: string;
      sizeBytes?: number;
      mimeType?: string;
      ttlHours?: number;
      passwordEnabled?: Boolean;
      password?: string;
    };

    if (!fileName || !sizeBytes || !ttlHours) {
      return res
        .status(400)
        .json({ message: "fileName, sizeBytes, ttlHours are required" });
    }
    const ext = path.extname(fileName).toLowerCase();
    if (BLOCKED_EXT.has(ext)) {
        return res
        .status(400)
        .json({ message: "illeeee don't send gandi files pls" });
    }
    // if (BLOCKED_EXT.has(mimeType)) {
    //     return res
    //     .status(400)
    //     .json({ message: "illeeee don't send gandi files pls" });
    // }
    
    if (!LIMITS.ALLOWED_TTL_HOURS.has(ttlHours as any)) {
      return res
        .status(400)
        .json({ message: "ttlHours must be 12, 24, or 48" });
    }
    if (sizeBytes <= 0 || sizeBytes > LIMITS.MAX_SINGLE_FILE_BYTES) {
      return res
        .status(400)
        .json({ message: `File too large. Max ${LIMITS.MAX_SINGLE_FILE_BYTES / 1024 / 1024}MB` });
    }

    const user = await User.findOne({ uniqueId });
    if (!user) {
      return res.status(401).json({ message: "Device not registered" });
    }

    const currentActive = user.activeFiles ?? 0;
    const currentUsed   = user.usedBytes   ?? 0;

    if (currentActive >= LIMITS.MAX_ACTIVE_FILES) {
      return res.status(403).json({
        message: `Max ${LIMITS.MAX_ACTIVE_FILES} active files allowed. Delete one first.`,
      });
    }
    if (currentUsed + sizeBytes > LIMITS.MAX_TOTAL_BYTES) {
      return res.status(403).json({
        message: `Storage quota exceeded. Max 500MB total.`,
      });
    }

    const shortCode = await getShortCode(); 
    const name      = safeName(fileName);
    const s3Key     = `filezap/${uniqueId}/${shortCode}/${name}`;
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const contentType = mimeType || "application/octet-stream";

    if(passwordEnabled){
        if(!password || password.length < 6 || password.length >32){
            return res.status(400).json({message : "password required"});
        }
    }
    const passwordHash = passwordEnabled && password ? await hashFilePassword(password) : null
    await File.create({
      ownerUniqueId: uniqueId,
      shortCode,
      s3Key,
      fileName: name,
      mimeType: contentType,
      sizeBytes,
      status: "uploading",
      expiresAt,
      passwordEnabled: !!passwordEnabled,
      passwordHash,
    });

    const uploadUrl = await getUploadUrl(s3Key, contentType);

    return res.status(200).json({
      shortCode,
      uploadUrl,
      expiresAt,
    });
  } catch (error: any) {
    console.error("[initUpload]", error.message);
    return res.status(500).json({ message: "Failed to init upload" });
  }
}

export async function completeUpload(req: Request, res: Response) {
  try {
    const uniqueId  = (req as any).device?.uniqueId as string;
    const { shortCode } = req.body as { shortCode?: string };

    if (!shortCode) {
      return res.status(400).json({ message: "shortCode required" });
    }

    const file = await File.findOne({ shortCode, ownerUniqueId: uniqueId });
    if (!file) return res.status(404).json({ message: "Not found" });
    if (file.status === "ready") return res.json({ ok: true }); // idempotent
    if (file.status !== "uploading") {
      return res.status(400).json({ message: "File is not in uploading state" });
    }

    // ── verify object actually landed in S3 ──────────────────────────────────
    let actualSize: number;
    try {
      const head = await headObject(file.s3Key);
      actualSize = head.ContentLength ?? 0;
    } catch {
      return res.status(400).json({ message: "File not found in storage yet. Try again." });
    }

    // size mismatch — possible tampering
    if (Math.abs(actualSize - file.sizeBytes) > 1024) {
      await deleteObject(file.s3Key).catch(() => {});
      await File.updateOne(
        { _id: file._id },
        { $set: { status: "deleted", deletedAt: new Date() } }
      );
      return res.status(400).json({ message: "Uploaded size mismatch. Rejected." });
    }

    // ── re-check quota at completion (prevents race conditions) ──────────────
    const user = await User.findOne({ uniqueId });
    if (!user) return res.status(401).json({ message: "Device not registered" });

    if (
      (user.activeFiles ?? 0) >= LIMITS.MAX_ACTIVE_FILES ||
      (user.usedBytes   ?? 0) + file.sizeBytes > LIMITS.MAX_TOTAL_BYTES
    ) {
      await deleteObject(file.s3Key).catch(() => {});
      await File.updateOne(
        { _id: file._id },
        { $set: { status: "deleted", deletedAt: new Date() } }
      );
      return res.status(403).json({ message: "Quota exceeded" });
    }

    // ── mark ready + update counters ─────────────────────────────────────────
    await File.updateOne({ _id: file._id }, { $set: { status: "ready" } });
    await User.updateOne(
      { uniqueId },
      { $inc: { usedBytes: file.sizeBytes, activeFiles: 1 } }
    );

    return res.status(200).json({
      ok: true,
      shortCode,
      expiresAt: file.expiresAt,
    });
  } catch (error: any) {
    console.error("[completeUpload]", error.message);
    return res.status(500).json({ message: "Failed to complete upload" });
  }
}