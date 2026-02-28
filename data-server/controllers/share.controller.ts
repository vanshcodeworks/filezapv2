import type { Request, Response } from "express";
import File from "../models/file.model";
import { emailQueue } from "../Queue/email.queue";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function shareByEmail(req: Request, res: Response) {
  try {
    const uniqueId = (req as any).device?.uniqueId as string;
    const { shortCode } = req.params;
    const { toEmail } = req.body as { toEmail?: string };

    if (!toEmail || !isValidEmail(toEmail)) {
      return res.status(400).json({ message: "Valid toEmail required" });
    }

    const file = await File.findOne({ shortCode, ownerUniqueId: uniqueId });
    if (!file || file.status !== "ready") {
      return res.status(404).json({ message: "File not found or not ready" });
    }
    if (file.expiresAt.getTime() <= Date.now()) {
      return res.status(410).json({ message: "File expired" });
    }

    const appBase = process.env.APP_BASE_URL || "http://localhost:5173";
    const link = `${appBase}/download/${shortCode}`;

    await emailQueue.add("send-share-link", {
      toEmail,
      fileName: file.fileName,
      link,
      expiresAt: file.expiresAt.toISOString(),
    });

    return res.json({ ok: true, queued: true });
  } catch {
    return res.status(500).json({ message: "Failed to queue email" });
  }
}