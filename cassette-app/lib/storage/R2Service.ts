/**
 * Cloudflare R2 Storage Service
 * Handles MP3 upload and presigned URL generation for media assets
 *
 * R2 is S3-compatible, so we use the AWS SDK with R2 endpoints
 */

import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
}

interface CachedUrl {
  url: string;
  expiresAt: Date;
}

class R2Service {
  private client: S3Client | null = null;
  private config: R2Config | null = null;
  private urlCache: Map<string, CachedUrl> = new Map();

  /**
   * Initialize R2 client from environment variables
   */
  private initClient(): S3Client {
    if (this.client) {
      return this.client;
    }

    const config: R2Config = {
      accountId: process.env.R2_ACCOUNT_ID || "",
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      bucketName: process.env.R2_BUCKET_NAME || "cassette-media-assets",
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || "",
    };

    if (!config.accountId || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error("R2 credentials not configured");
    }

    this.config = config;

    this.client = new S3Client({
      region: "auto",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    });

    return this.client;
  }

  /**
   * Upload MP3 file to R2
   * Returns the storage key and public URL
   */
  async uploadMP3(
    filePath: string,
    mediaAssetId: string,
    fileName?: string
  ): Promise<{
    success: boolean;
    storageKey?: string;
    publicUrl?: string;
    error?: string;
  }> {
    try {
      const client = this.initClient();
      const config = this.config!;

      // Generate storage key
      const storageKey = `media-assets/${mediaAssetId}.mp3`;

      // Read file (in production, would use stream)
      const fs = await import("fs/promises");
      const fileBuffer = await fs.readFile(filePath);

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
        Body: fileBuffer,
        ContentType: "audio/mpeg",
        CacheControl: "public, max-age=31536000, immutable", // 1 year
        Metadata: {
          "asset-id": mediaAssetId,
          "uploaded-at": new Date().toISOString(),
        },
        // CORS headers for browser playback
        WebsiteRedirectLocation: undefined,
      });

      await client.send(command);

      // Construct public URL
      const publicUrl = `${config.publicBaseUrl}/${storageKey}`;

      return {
        success: true,
        storageKey,
        publicUrl,
      };
    } catch (error) {
      console.error("[R2Service.uploadMP3] Error:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Check if object exists in R2
   */
  async objectExists(storageKey: string): Promise<boolean> {
    try {
      const client = this.initClient();
      const config = this.config!;

      const command = new HeadObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
      });

      await client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === "NotFound") {
        return false;
      }
      console.warn("[R2Service.objectExists] Error:", error);
      return false;
    }
  }

  /**
   * Get a presigned URL for MP3 playback
   * Signed URLs expire after expiresIn seconds
   * Results are cached to avoid regenerating URLs repeatedly
   */
  async getSignedPlaybackUrl(
    storageKey: string,
    expiresIn: number = 3600 // 1 hour default
  ): Promise<{
    success: boolean;
    url?: string;
    expiresAt?: Date;
    error?: string;
  }> {
    try {
      // Clean up expired URLs from cache
      this.cleanupExpiredUrls();

      // Check cache first
      const cached = this.urlCache.get(storageKey);
      if (cached && cached.expiresAt > new Date()) {
        // Cache hit and still valid
        return {
          success: true,
          url: cached.url,
          expiresAt: cached.expiresAt,
        };
      }

      // Cache miss or expired, generate new URL
      const client = this.initClient();
      const config = this.config!;

      const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
      });

      // Generate signed URL (valid for expiresIn seconds)
      const signedUrl = await getSignedUrl(client, command, {
        expiresIn,
      });

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      // Cache the generated URL
      this.urlCache.set(storageKey, {
        url: signedUrl,
        expiresAt,
      });

      return {
        success: true,
        url: signedUrl,
        expiresAt,
      };
    } catch (error) {
      console.error("[R2Service.getSignedPlaybackUrl] Error:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }

  /**
   * Get public URL (non-signed, works if bucket is public)
   */
  getPublicUrl(storageKey: string): string {
    const config = this.config;
    if (!config) {
      throw new Error("R2 not initialized");
    }
    return `${config.publicBaseUrl}/${storageKey}`;
  }

  /**
   * Clear expired URLs from cache
   */
  private cleanupExpiredUrls(): void {
    const now = new Date();
    for (const [key, cached] of this.urlCache.entries()) {
      if (cached.expiresAt <= now) {
        this.urlCache.delete(key);
      }
    }
  }

  /**
   * Delete object from R2
   */
  async deleteObject(storageKey: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const client = this.initClient();
      const config = this.config!;

      const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

      const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: storageKey,
      });

      await client.send(command);

      return { success: true };
    } catch (error) {
      console.error("[R2Service.deleteObject] Error:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  }
}

// Singleton instance
let r2Service: R2Service | null = null;

export function getR2Service(): R2Service {
  if (!r2Service) {
    r2Service = new R2Service();
  }
  return r2Service;
}

export default R2Service;
