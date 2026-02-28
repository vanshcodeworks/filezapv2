export type ShareDuration = "12hr" | "24hr" | "48hr";

export interface UploadSession {
  shortCode: string;
  fileName: string;
  fileSize: number;
  expiry: ShareDuration;
  createdAt: number;
}

export interface UploadSessionResponse {
  uploadUrl: string;
  shortUrl: string;
}

export interface DownloadUrlResponse {
  getDownloadUrl: string;
  message?: string;
}
