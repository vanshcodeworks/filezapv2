# FileZap (data-server) — API Reference

**API Base (local):** `http://localhost:3000/v1`

This server supports:
- No-login “ownership” using headers (`x-device-id`, `x-owner-key`)
- Direct-to-storage upload using **presigned PUT**
- Expiring links (12/24/48 hours) via `expiresAt` + Mongo TTL index
- Optional file password for download unlock
- Owner actions: list + delete
- Share by email (BullMQ)

---

## Ownership headers (required for owner-only routes)

Send on owner-only routes:

- `x-device-id: <fingerprintjs_unique_id>`
- `x-owner-key: <random_secret_32+chars>`

Public routes do not require these headers.

---

## Status codes

- `200` OK
- `400` Invalid input
- `401` Missing owner headers / invalid
- `403` Forbidden (wrong owner key, quota exceeded)
- `404` Not found
- `409` Not ready (still uploading)
- `410` Gone (expired)
- `429` Rate limited
- `500` Server error

---

# Endpoints

## 1) Device

### `POST /v1/device/upsert`
Registers a device and binds ownership to `ownerKey`.

**Body**
```json
{
  "uniqueId": "fpjs_device_id",
  "ownerKey": "your_long_secret_key"
}
```

**Response**
```json
{ "ok": true }
```

---

## 2) Upload (Owner-only)

### `POST /v1/upload/init`
Creates a DB record and returns a presigned PUT URL.

**Headers**
- `x-device-id`
- `x-owner-key`

**Body**
```json
{
  "fileName": "demo.pdf",
  "sizeBytes": 102400,
  "mimeType": "application/pdf",
  "ttlHours": 12,

  "passwordEnabled": true,
  "password": "optional-if-enabled"
}
```

**Response**
```json
{
  "shortCode": "AB12CD34",
  "uploadUrl": "https://...presigned-put...",
  "expiresAt": "2026-02-28T12:00:00.000Z"
}
```

**Client next step**
- `PUT <uploadUrl>` (binary body, `Content-Type` should match `mimeType`)

---

### `POST /v1/upload/complete`
Marks upload as ready after the PUT finishes (server verifies size/object).

**Headers**
- `x-device-id`
- `x-owner-key`

**Body**
```json
{ "shortCode": "AB12CD34" }
```

**Response**
```json
{
  "ok": true,
  "shortCode": "AB12CD34",
  "expiresAt": "2026-02-28T12:00:00.000Z"
}
```

---

## 3) Download (Public)

### `GET /v1/download/:shortCode`
Returns metadata + either a download URL (unprotected) or `requiresPassword: true`.

**Response (unprotected)**
```json
{
  "shortCode": "AB12CD34",
  "fileName": "demo.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 102400,
  "expiresAt": "2026-02-28T12:00:00.000Z",
  "requiresPassword": false,
  "downloadUrl": "https://...presigned-get..."
}
```

**Response (password-protected)**
```json
{
  "shortCode": "AB12CD34",
  "fileName": "demo.pdf",
  "sizeBytes": 102400,
  "expiresAt": "2026-02-28T12:00:00.000Z",
  "requiresPassword": true
}
```

---

### `POST /v1/download/:shortCode/unlock`
Unlock endpoint for password-protected files.

**Body**
```json
{ "password": "MyPass@123" }
```

**Response**
```json
{
  "downloadUrl": "https://...presigned-get...",
  "fileName": "demo.pdf"
}
```

---

## 4) Files (Owner-only)

### `GET /v1/files`
Lists non-deleted files for the owner device.

**Headers**
- `x-device-id`
- `x-owner-key`

**Response**
```json
{
  "files": [
    {
      "shortCode": "AB12CD34",
      "fileName": "demo.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 102400,
      "status": "ready",
      "expiresAt": "2026-02-28T12:00:00.000Z",
      "createdAt": "2026-02-28T01:00:00.000Z"
    }
  ],
  "quota": {
    "usedBytes": 102400,
    "activeFiles": 1,
    "maxBytes": 524288000,
    "maxFiles": 5
  }
}
```

---

### `DELETE /v1/files/:shortCode`
Owner deletes a file (storage object + DB mark).

**Headers**
- `x-device-id`
- `x-owner-key`

**Response**
```json
{ "ok": true }
```

---

## 5) Share (Owner-only)

### `POST /v1/share/email/:shortCode`
Queues an email job (BullMQ). Email should contain **app link**, not presigned URL.

**Headers**
- `x-device-id`
- `x-owner-key`

**Body**
```json
{ "toEmail": "recipient@example.com" }
```

**Response**
```json
{ "ok": true, "queued": true }
```

---

# Client integration notes

- Owner-only calls must include headers `x-device-id` and `x-owner-key`.
- Use `VITE_API_BASE_URL` in the client to point to the server:
  - local: `http://localhost:3000/v1`
  - prod: `https://<your-api-domain>/v1`