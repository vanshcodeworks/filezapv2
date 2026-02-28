import type { Request, Response } from "express";
import File from "../models/file.model";
import User from "../models/user.model";
import { deleteObject } from "../utils/s3";


export async function listFiles(req: Request, res: Response) {
  try {
    const uniqueId = (req as any).device?.uniqueId as string;

    const files = await File.find({
      ownerUniqueId: uniqueId,
      status: { $ne: "deleted" },
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .select("-s3Key -__v"); 

    const user = await User.findOne({ uniqueId }).select("usedBytes activeFiles");

    return res.status(200).json({
      files: files.map((f) => ({
        shortCode: f.shortCode,
        fileName:  f.fileName,
        mimeType:  f.mimeType,
        sizeBytes: f.sizeBytes,
        status:    f.status,
        expiresAt: f.expiresAt,
        createdAt: f.createdAt,
      })),
      quota: {
        usedBytes:   user?.usedBytes   ?? 0,
        activeFiles: user?.activeFiles ?? 0,
        maxBytes:    500 * 1024 * 1024,
        maxFiles:    5,
      },
    });
  } catch (error: any) {
    console.error("[listFiles]", error.message);
    return res.status(500).json({ message: "Failed to list files" });
  }
}


export async function deleteFile(req: Request, res: Response) {
  try {
    const uniqueId  = (req as any).device?.uniqueId as string;
    const { shortCode } = req.params;

    const file = await File.findOne({ shortCode, ownerUniqueId: uniqueId });

    if (!file || file.status === "deleted") {
      return res.status(404).json({ message: "File not found" });
    }

    // delete from S3 first (if it fails, don't update DB — try again late)
    await deleteObject(file.s3Key);

    const wasReady  = file.status === "ready";
    const sizeBytes = file.sizeBytes;

    await File.updateOne(
      { _id: file._id },
      { $set: { status: "deleted", deletedAt: new Date() } }
    );

    if (wasReady) {
      await User.updateOne(
        { uniqueId },
        {
          $inc: {
            usedBytes:   -sizeBytes,
            activeFiles: -1,
          },
        }
      );
    }

    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("[deleteFile]", error.message);
    return res.status(500).json({ message: "Failed to delete file" });
  }
}