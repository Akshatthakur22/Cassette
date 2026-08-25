/**
 * FFmpeg processor for MP3 conversion
 */

import { execSync, spawn } from "child_process";
import { existsSync, statSync } from "fs";
import { createHash } from "crypto";
import { readFileSync } from "fs";

interface ConversionResult {
  success: boolean;
  error?: string;
}

interface ValidationResult {
  valid: boolean;
  duration?: number;
  error?: string;
}

/**
 * Convert WebM to MP3 using FFmpeg
 * Optimized for speed and minimal file size
 */
export async function convertToMP3(
  inputPath: string,
  outputPath: string,
  bitrate: number
): Promise<ConversionResult> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, error: "Conversion timeout (10 minutes)" });
    }, 10 * 60 * 1000);

    try {
      const proc = spawn("ffmpeg", [
        "-i",
        inputPath,
        // Aggressive compression for speed & size
        "-b:a",
        `${bitrate}k`, // Ultra-low bitrate
        "-ar",
        "22050", // Reduce sample rate to 22050 Hz (from 44100)
        "-ac",
        "1", // Convert to mono (from stereo)
        "-codec:a",
        "libmp3lame", // MP3 codec
        "-q:a",
        "9", // Lowest quality (highest compression)
        "-f",
        "mp3",
        outputPath,
      ]);

      let stderr = "";

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        clearTimeout(timeout);

        if (code === 0 && existsSync(outputPath)) {
          const fileSize = statSync(outputPath).size;
          if (fileSize > 0) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: "Output file is empty" });
          }
        } else {
          resolve({
            success: false,
            error: stderr || "Conversion failed",
          });
        }
      });

      proc.on("error", (error) => {
        clearTimeout(timeout);
        resolve({
          success: false,
          error: String(error),
        });
      });
    } catch (error) {
      clearTimeout(timeout);
      resolve({
        success: false,
        error: String(error),
      });
    }
  });
}

/**
 * Validate MP3 file
 */
export async function validateMP3(filePath: string): Promise<ValidationResult> {
  try {
    // Simpler ffprobe command without problematic options
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`,
      { encoding: "utf8" }
    );
    const duration = Math.round(parseFloat(result.trim()));

    if (duration > 0) {
      return { valid: true, duration };
    } else {
      return { valid: false, error: "Invalid duration" };
    }
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}

/**
 * Calculate SHA256 checksum of file
 */
export function calculateChecksum(filePath: string): string {
  const buffer = readFileSync(filePath);
  return createHash("sha256").update(buffer).digest("hex");
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  return statSync(filePath).size;
}
