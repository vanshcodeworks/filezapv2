import crypto from "crypto";
import File from "../models/file.model";

function generateCode(length = 8): string {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

export async function getShortCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode(8);
    const exists = await File.exists({ shortCode: code });
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique short code");
}