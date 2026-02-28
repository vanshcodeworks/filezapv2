import type { Request, Response } from "express";
import { getDownloadUrl, deleteObject } from "../utils/s3";
import File from "../models/file.model";
import { verifyFilePassword } from "../utils/password";
export async function download(req: Request, res: Response) {
  try {
    const { shortCode } = req.params;


    if (!shortCode) {
      return res.status(400).json({ message: "shortCode required" });
    }

    const file = await File.findOne({ shortCode });

    if (!file || file.status === "deleted") {
      return res.status(404).json({ message: "File not found" });
    }

    if (file.status !== "ready") {
      return res.status(409).json({ message: "File not ready yet" });
    }
        if (file.expiresAt.getTime() <= Date.now()) {
      await deleteObject(file.s3Key).catch(() => {});
      await File.updateOne(
        { _id: file._id },
        { $set: { status: "deleted", deletedAt: new Date() } }
      );
      return res.status(410).json({ message: "File has expired" });
    }
    
    if (file.passwordEnabled) {
      return res.status(200).json({
        shortCode,
        fileName: file.fileName,
        sizeBytes: file.sizeBytes,
        expiresAt: file.expiresAt,
        requiresPassword: true,
      })
    }




    const downloadUrl = await getDownloadUrl(file.s3Key, file.fileName);

    return res.status(200).json({
      shortCode,
      fileName:    file.fileName,
      mimeType:    file.mimeType,
      sizeBytes:   file.sizeBytes,
      expiresAt:   file.expiresAt,
      requiresPassword: false,
      downloadUrl,
    });
  } catch (error: any) {
    console.error("[download]", error.message);
    return res.status(500).json({ message: "Error generating download" });
  }
}

export async function unlockDownload(req: Request, res: Response) {
  try {
    const { shortCode } = req.params
    const { password } = req.body as { password?: string }

    if (!password) return res.status(400).json({ message: "Password required" })

    // must fetch passwordHash explicitly if select:false
    const file = await File.findOne({ shortCode }).select("+passwordHash")
    if (!file || file.status !== "ready") return res.status(404).json({ message: "File not found" })
    if (file.expiresAt.getTime() <= Date.now()) return res.status(410).json({ message: "File expired" })
    if (!file.passwordEnabled || !file.passwordHash) return res.status(400).json({ message: "Password not enabled" })

    const ok = await verifyFilePassword(password, file.passwordHash)
    if (!ok) return res.status(401).json({ message: "Invalid password" })

    const downloadUrl = await getDownloadUrl(file.s3Key, file.fileName)
    return res.status(200).json({
      requiresPassword: false,
      downloadUrl,
      fileName: file.fileName,
    })
  } catch (error: any) {
    return res.status(500).json({ message: "Unlock failed" })
  }
}