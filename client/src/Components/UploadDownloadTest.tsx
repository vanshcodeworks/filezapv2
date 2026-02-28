import { useState } from "react";
import {
  createUploadSession,
  getDownloadUrl,
  uploadFileToStorage,
} from "../services/api";

export default function UploadDownloadTest() {
  const [file, setFile] = useState<File | null>(null);
  const [shortCode, setShortCode] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  // 1️⃣ Request upload URL from backend
  async function handleUpload() {
    if (!file) return alert("Select a file first");

    try {
      const { uploadUrl, shortUrl } = await createUploadSession(
        file.name,
        file.type,
      );
      setShortCode(shortUrl);
      await uploadFileToStorage(uploadUrl, file);
      alert("File uploaded successfully");
    } catch {
      alert("Upload failed");
    }
  }

  // 3️⃣ Get download URL using shortcode
  async function handleDownload() {
    if (!shortCode) return alert("Enter shortcode");

    try {
      const data = await getDownloadUrl(shortCode);
      setDownloadUrl(data.getDownloadUrl);
    } catch {
      alert("Could not fetch download URL");
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "500px" }}>
      <h2>FileZap – Upload / Download Test</h2>

      {/* Upload */}
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <br />
      <button onClick={handleUpload}>Upload</button>

      {shortCode && (
        <p>
          Short Code: <strong>{shortCode}</strong>
        </p>
      )}

      <hr />

      {/* Download */}
      <input
        placeholder="Enter short code"
        value={shortCode}
        onChange={(e) => setShortCode(e.target.value)}
      />
      <br />
      <button onClick={handleDownload}>Get Download Link</button>

      {downloadUrl && (
        <p>
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            Download File
          </a>
        </p>
      )}
    </div>
  );
}