import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// 1. Configure S3 Client for Backblaze B2
const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
});

const TEST_FILE_NAME = "filezap/test-upload-" + Date.now() + ".txt";
const TEST_CONTENT = "Hello from FileZap! This is a server-side test.";

async function runTest() {
  console.log("🚀 Starting B2 Server-Side Test...\n");

  try {

    console.log(` Uploading file: ${TEST_FILE_NAME}...`);
    await s3.send(new PutObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: TEST_FILE_NAME,
      Body: TEST_CONTENT,
      ContentType: "text/plain",
    }));

    console.log("✅ Upload successful!");

    // --- STEP 2: GENERATE SIGNED URL (Simulating Download Link) ---
    console.log("\n Generating Signed Download URL...");
    
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: TEST_FILE_NAME,
    });

    // Generate a URL valid for 60 seconds
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    console.log(`🔗 URL Generated: ${signedUrl.substring(0, 50)}...`);

    // --- STEP 3: DOWNLOAD VIA URL ---
    console.log("\n  Testing Download via URL...");
    
    const response = await fetch(signedUrl);
    
    if (!response.ok) {
        throw new Error(`Download failed with status: ${response.status}`);
    }

    const text = await response.text();
    console.log(`📄 Content received: "${text}"`);

    // --- VERIFICATION ---
    if (text === TEST_CONTENT) {
        console.log("\n🎉 SUCCESS: Uploaded content matches downloaded content!");
    } else {
        console.error("\n❌ FAILED: Content mismatch.");
    }

  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
  }
}

runTest();