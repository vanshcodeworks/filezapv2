import fpPromise from "@fingerprintjs/fingerprintjs";

export function generatePeerId(): string {
  return crypto.randomUUID();
}

export function generateRoomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function toBase64Url(bytes: Uint8Array) {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function getDeviceId(): Promise<string> {
  const fp = await fpPromise.load();
  const result = await fp.get();
  return result.visitorId;
}

export function getOrCreateOwnerKey(): string {
  const KEY = "fz_owner_key_v1";
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const ownerKey = toBase64Url(bytes);
  localStorage.setItem(KEY, ownerKey);
  return ownerKey;
}
