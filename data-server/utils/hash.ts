import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function hashOwnerKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10);
}

export async function verifyOwnerKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}