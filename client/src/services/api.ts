export type OwnerAuth = {
  deviceId: string;
  ownerKey: string;
};

const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL?.toString() || "http://localhost:3000/v1";

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

function ownerHeaders(auth?: OwnerAuth): Record<string, string> {
  if (!auth) return {};
  return {
    "x-device-id": auth.deviceId,
    "x-owner-key": auth.ownerKey,
  };
}

/** DEVICE */
export async function upsertDevice(input: { uniqueId: string; ownerKey: string }) {
  const res = await fetch(`${API_BASE}/device/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return readJson<{ ok: boolean }>(res);
}

/** UPLOAD */
export type InitUploadRequest = {
  fileName: string;
  sizeBytes: number;
  mimeType?: string;
  ttlHours: 12 | 24 | 48;
  passwordEnabled?: boolean;
  password?: string;
};

export type InitUploadResponse = {
  shortCode: string;
  uploadUrl: string;
  expiresAt: string;
};

export async function initUpload(auth: OwnerAuth, body: InitUploadRequest) {
  const res = await fetch(`${API_BASE}/upload/init`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...ownerHeaders(auth),
    },
    body: JSON.stringify(body),
  });
  return readJson<InitUploadResponse>(res);
}

export async function putToPresignedUrl(uploadUrl: string, file: File, mimeType?: string) {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType || file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!res.ok) throw new Error(`Upload failed (HTTP ${res.status})`);
  return true;
}

export async function completeUpload(auth: OwnerAuth, shortCode: string) {
  const res = await fetch(`${API_BASE}/upload/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...ownerHeaders(auth),
    },
    body: JSON.stringify({ shortCode }),
  });
  return readJson<{ ok: boolean; shortCode: string; expiresAt: string }>(res);
}

/** DOWNLOAD (public) */
export type DownloadMetaResponse =
  | {
      shortCode: string;
      fileName: string;
      mimeType?: string;
      sizeBytes: number;
      expiresAt: string;
      requiresPassword: false;
      downloadUrl: string;
    }
  | {
      shortCode: string;
      fileName: string;
      sizeBytes: number;
      expiresAt: string;
      requiresPassword: true;
    };

export async function getDownloadMeta(shortCode: string) {
  const res = await fetch(`${API_BASE}/download/${encodeURIComponent(shortCode)}`, {
    method: "GET",
  });
  return readJson<DownloadMetaResponse>(res);
}

export async function unlockDownload(shortCode: string, password: string) {
  const res = await fetch(`${API_BASE}/download/${encodeURIComponent(shortCode)}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return readJson<{ downloadUrl: string; fileName: string }>(res);
}

/** FILES (owner-only) */
export async function listFiles(auth: OwnerAuth) {
  const res = await fetch(`${API_BASE}/files`, {
    method: "GET",
    headers: {
      ...ownerHeaders(auth),
    },
  });
  return readJson<{
    files: Array<{
      shortCode: string;
      fileName: string;
      mimeType?: string;
      sizeBytes: number;
      status: "uploading" | "ready" | "deleted";
      expiresAt: string;
      createdAt: string;
    }>;
    quota: {
      usedBytes: number;
      activeFiles: number;
      maxBytes: number;
      maxFiles: number;
    };
  }>(res);
}

export async function deleteFile(auth: OwnerAuth, shortCode: string) {
  const res = await fetch(`${API_BASE}/files/${encodeURIComponent(shortCode)}`, {
    method: "DELETE",
    headers: {
      ...ownerHeaders(auth),
    },
  });
  return readJson<{ ok: boolean }>(res);
}

/** SHARE (owner-only) */
export async function shareByEmail(auth: OwnerAuth, shortCode: string, toEmail: string) {
  const res = await fetch(`${API_BASE}/share/email/${encodeURIComponent(shortCode)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...ownerHeaders(auth),
    },
    body: JSON.stringify({ toEmail }),
  });
  return readJson<{ ok: boolean; queued: boolean }>(res);
}