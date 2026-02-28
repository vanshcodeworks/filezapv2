import { QueueEvents } from "bullmq";
import { emailQueue } from "../Queue/email.queue";

if (!process.env.REDIS_URL) {
  throw new Error("Missing REDIS_URL");
}

const queueEvents = new QueueEvents("share-email", {
  connection: { url: process.env.REDIS_URL },
});

await queueEvents.waitUntilReady();

const job = await emailQueue.add("send-share-link", {
  toEmail: "vanshcodeworks@gmail.com",
  fileName: "demo.pdf",
  link: "http://localhost:5173/download/TEST1234",
  expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
});

console.log("[testemail] queued job:", job.id);

try {
  const result = await job.waitUntilFinished(queueEvents, 30000);
  console.log("[testemail] completed:", result ?? "ok");
} catch (err: any) {
  console.error("[testemail] failed:", err?.message || err);
} finally {
  await queueEvents.close();
  await emailQueue.close();
  process.exit(0);
}