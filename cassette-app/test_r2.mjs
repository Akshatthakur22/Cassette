import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync } from "fs";

const R2_ACCOUNT_ID = "c0dd08352d54749e7a69b89cc9a6a296";
const R2_ACCESS_KEY_ID = "6e0b10379df38cc845e3389b75cb8191";
const R2_SECRET_ACCESS_KEY = "73f8b93ec4c6f8b1a9d0d161c99a82b416ae206431c0fc5bb37095f7f4c37e13";
const R2_BUCKET_NAME = "cassette-media";

const client = new S3Client({
  region: "auto",
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});

try {
  const fileBuffer = readFileSync("/tmp/test-download/output.mp3");
  console.log("File size:", fileBuffer.length);
  
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: "test-upload/tere-bin-test.mp3",
    Body: fileBuffer,
    ContentType: "audio/mpeg",
  });
  
  const result = await client.send(command);
  console.log("Upload successful:", result.ETag);
} catch (error) {
  console.error("Upload failed:", error.message);
}
