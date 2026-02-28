import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
});

async function enableCors() {
  console.log("🔓 Unlocking CORS for Bucket:", process.env.B2_BUCKET);

  const command = new PutBucketCorsCommand({
    Bucket: process.env.B2_BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          // ⚠️ In production, change "*" to "https://your-domain.com"
          AllowedOrigins: ["*"], 
          AllowedMethods: ["GET", "PUT", "POST", "HEAD"],
          AllowedHeaders: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3000,
        },
      ],
    },
  });

  try {
    await s3.send(command);
    console.log(" Success! CORS is now enabled. You can upload from localhost.");
  } catch (err) {
    console.error("❌ Error setting CORS:", err);
  }
}

enableCors();