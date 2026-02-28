import crypto from "crypto"

export function hashOwnerKey(ownerKey: string) {
  return crypto.createHash("sha256").update(ownerKey, "utf8").digest("hex")
}

export function safeEqualHex(a: string, b: string) {
    if (a.length !== b.length) return false;
  const ab = Buffer.from(a, "hex")
  const bb = Buffer.from(b, "hex")
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}