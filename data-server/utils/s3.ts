import { S3Client, PutObjectCommand, GetObjectCommand , HeadObjectCommand , DeleteObjectCommand} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.B2_REGION,
  endpoint: process.env.B2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
export const S3_BUCKET = process.env.B2_BUCKET;

export const getUploadUrl = async (key: string, contentType: string = "application/octet-stream") => {
  const command = new PutObjectCommand({
    Bucket: process.env.B2_BUCKET,
    Key: key,
    ContentType: contentType, 
  });


  return await getSignedUrl(s3, command, { expiresIn: 600 });
};


export const getDownloadUrl = async (key: string , fileName : string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.B2_BUCKET,
    Key: key,
      // ResponseContentDisposition: `attachment; filename="${fileName.replace(/"/g, "")}"`,
  });
  return await getSignedUrl(s3, command, { expiresIn: 300 });
};

export const headObject = async (key : string) => {
  const command = new HeadObjectCommand({
     Bucket : process.env.B2_BUCKET,
     Key : key,
    });
    return s3.send(command);
}

export const deleteObject = async(key : string) => {
  const command = new DeleteObjectCommand({
    Bucket : process.env.B2_BUCKET,
    Key : key
  });
  return s3.send(command);
};