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
      let stdout = "";

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.on("close", (code) => {
        clearTimeout(timeout);

        if (code === 0 && existsSync(outputPath)) {
          const fileSize = statSync(outputPath).size;
          if (fileSize > 0) {
            console.log(`[convertToMP3] Conversion successful: ${fileSize} bytes`);
            resolve({ success: true });
          } else {
            console.error("[convertToMP3] Output file is empty");
            resolve({ success: false, error: "Output file is empty" });
          }
        } else {
          const errorMsg = stderr.substring(0, 200);
          console.error("[convertToMP3] FFmpeg failed (code: " + code + "):", errorMsg);

          // Detect specific conversion errors
          const lowerError = (stderr + stdout).toLowerCase();

          if (lowerError.includes("codec") || lowerError.includes("unknown encoder")) {
            resolve({
              success: false,
              error: "FFmpeg codec error - MP3 encoder not available",
            });
          } else if (lowerError.includes("input/output")) {
            resolve({
              success: false,
              error: "Input/output error - check file permissions",
            });
          } else if (lowerError.includes("stream")) {
            resolve({
              success: false,
              error: "No audio stream found in input file",
            });
          } else {
            resolve({
              success: false,
              error: errorMsg || "Conversion failed",
            });
          }
        }
      });

      proc.on("error", (error) => {
        clearTimeout(timeout);
        console.error("[convertToMP3] Process error:", error);
        resolve({
          success: false,
          error: `FFmpeg error: ${String(error).substring(0, 100)}`,
        });
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error("[convertToMP3] Catch error:", error);
      resolve({
        success: false,
        error: `Error: ${String(error).substring(0, 100)}`,
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
      console.log(`[validateMP3] MP3 validated: ${duration}s duration`);
      return { valid: true, duration };
    } else {
      console.warn(`[validateMP3] Invalid duration: ${result.trim()}`);
      return { valid: false, error: "Invalid duration" };
    }
  } catch (error) {
    console.error(`[validateMP3] Validation error:`, error);
    const errorStr = String(error);
    
    // Detect specific errors
    if (errorStr.includes("not found") || errorStr.includes("No such file")) {
      return { valid: false, error: "File not found" };
    } else if (errorStr.includes("invalid data")) {
      return { valid: false, error: "File is corrupted or not an MP3" };
    } else {
      return { valid: false, error: `Validation failed: ${errorStr.substring(0, 80)}` };
    }
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
