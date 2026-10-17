# FileZap

File sharing over WebSocket, with a QR-code handoff and email notifications.

Live at **filezap.vanshcodeworks.com**

## Layout

```
client/       React + Vite frontend
server/       API server
data-server/  transfer service: S3 storage, BullMQ queue, SMTP
```

## Stack

**client** - `react`, `react-dom`, `react-router-dom`, `react-qr-code`,
`@fingerprintjs/fingerprintjs`, `unique-names-generator`, `lucide-react`,
Tailwind

**data-server** - `express`, `@aws-sdk/client-s3` (with presigned URLs),
`bullmq`, `mongoose`, `nodemailer`, `bcryptjs`

## Setup

Each package installs and runs independently:

```bash
cd client       && npm install && npm run dev
cd server       && npm install && npm start
cd data-server  && npm install && node index.js
```

Copy the matching `.env.example` in each package to `.env` and fill it in.

## How a transfer works

1. The sender uploads; the data server issues a presigned S3 URL.
2. A QR code encodes the transfer handle - the recipient scans it.
3. BullMQ carries the job; progress is relayed over the signaling WebSocket.
4. On completion the recipient gets an email via Nodemailer.

## Environment

`data-server/.env.example` covers Backblaze B2 (S3-compatible) credentials,
MongoDB, Redis and SMTP. `client/.env.example` and `server/.env.example` cover
the frontend and API base URLs.

## Security

`client/.env` was previously tracked. It contained only
`VITE_API_BASE_URL` and `VITE_SIGNALING_URL` - not secrets - but it is now
git-ignored with a committed `.env.example` in its place.
