import express from 'express';
import type {Request , Response , NextFunction} from 'express';
import cors from "cors";

import upload from "./routes/upload.route";
import download from "./routes/download.route";
import device from "./routes/device.routes"
import file from "./routes/file.routes"
import share from "./routes/share.routes"
import { connectDb } from './database/connectDb';

if (process.env.REDIS_URL && process.env.SMTP_USER) {
  await import("./Worker/sendMail");
  console.log("[worker] email worker started in-process");
} else {
  console.warn("[worker] skipped — REDIS_URL or SMTP_USER missing");
}

const app = express();
const PORT = process.env.PORT || 3000;
// required for ip
app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "x-device-id",    
      "x-owner-key",    
    ],
  })
);
app.use(express.json({ limit: "1mb" }));
await connectDb();

app.use("/v1/device", device);
app.use("/v1/upload", upload);
app.use("/v1/download", download);
app.use("/v1/files", file);    
app.use("/v1/share", share);    
app.get("/health", (_req, res) => res.json({ ok: true }));

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err: Error, req: Request,res: Response, next:NextFunction) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT , ()=>{
    console.log(`data-server running on port ${PORT}`)
})
