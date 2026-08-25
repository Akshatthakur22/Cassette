/**
 * R2Client for media worker
 * Wraps R2Service for server-side use
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFileSync, statSync } from "fs";
import { createHash } from "crypto";

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export class R2Client {
  private client: S3Client;
  private config: R2Config;

  constructor(config: R2Config) {
    this.config = config;

    if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    this.client = new S3Client({
      region: "auto",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    });
  }

  async uploadMP3(
    filePath: string,
    mediaAssetId: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const fileBuffer = readFileSync(filePath);
      const storageKey = `media-assets/${mediaAssetId}.mp3`;

      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: storageKey,
        Body: fileBuffer,
        ContentType: "audio/mpeg",
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: {
          "asset-id": mediaAssetId,
          "uploaded-at": new Date().toISOString(),
        },
      });

      await this.client.send(command);

      console.log("[R2Client.uploadMP3] Success:", {
        storageKey,
        fileSize: fileBuffer.length,
      });

      return { success: true };
    } catch (error) {
      console.error("[R2Client.uploadMP3] Error:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  async close(): Promise<void> {
    this.client.destroy();
  }
}

export function createR2ClientFromEnv(): R2Client | null {
  const config: R2Config = {
    accountId: process.env.R2_ACCOUNT_ID || "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucketName: process.env.R2_BUCKET_NAME || "cassette-media-assets",
  };

  if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
    return null;
  }

  return new R2Client(config);
}
