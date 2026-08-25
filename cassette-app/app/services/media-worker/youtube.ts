/**
 * YouTube audio extraction processor
 * Uses yt-dlp to validate and download audio
 */

import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

interface ValidationResult {
  valid: boolean;
  title?: string;
  duration?: number;
  error?: string;
}

interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * Validate YouTube video exists and is accessible
 * Detects: deleted, geo-restricted, age-restricted, copyright, playback-restricted videos
 */
export async function validateYouTubeVideo(
  videoId: string
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    try {
      const result = execSync(
        `yt-dlp --no-warnings -j "https://www.youtube.com/watch?v=${videoId}"`,
        { timeout: 30000, encoding: "utf8" }
      );

      const info = JSON.parse(result);

      resolve({
        valid: true,
        title: info.title,
        duration: info.duration,
      });
    } catch (error: any) {
      const errorMsg = String(error);

      // Copyright detection
      if (
        errorMsg.includes("copyright") ||
        errorMsg.includes("music licensing") ||
        errorMsg.includes("rights holder") ||
        errorMsg.includes("ERROR 403") ||
        errorMsg.includes("HTTP Error 403")
      ) {
        resolve({ 
          valid: false, 
          error: "Video contains copyrighted content and cannot be downloaded" 
        });
      }
      // Deleted videos
      else if (errorMsg.includes("not found")) {
        resolve({ valid: false, error: "Video not found" });
      } 
      // Geo-restriction
      else if (errorMsg.includes("georestricted")) {
        resolve({ valid: false, error: "Video is geo-restricted" });
      } 
      // Age-restriction
      else if (errorMsg.includes("age")) {
        resolve({ valid: false, error: "Video is age-restricted" });
      }
      // Playback restrictions
      else if (errorMsg.includes("embed") || errorMsg.includes("playback")) {
        resolve({ valid: false, error: "Video playback is restricted by owner" });
      }
      // Catch-all
      else {
        resolve({ valid: false, error: "Cannot access video" });
      }
    }
  });
}

/**
 * Download audio from YouTube
 * Downloads best available audio in m4a format with speed optimizations
 * Detects copyright, playback restrictions, and other errors
 */
export async function downloadYouTubeAudio(
  videoId: string,
  outputDir: string
): Promise<DownloadResult> {
  return new Promise((resolve) => {
    const outputPath = join(outputDir, "audio.%(ext)s");
    const timeoutMs = 5 * 60 * 1000; // 5 minutes
    const timeout = setTimeout(() => {
      resolve({ success: false, error: "Download timeout (5 minutes)" });
    }, timeoutMs);

    try {
      const proc = spawn("yt-dlp", [
        "--no-warnings",
        "-f",
        "bestaudio[ext=m4a]/bestaudio", // Prefer m4a to avoid re-encoding
        "-x", // Extract audio
        "--audio-format",
        "m4a",
        "-o",
        outputPath,
        `https://www.youtube.com/watch?v=${videoId}`,
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

        if (code === 0) {
          // Check for m4a first, then fall back to other possible formats
          const m4aPath = join(outputDir, "audio.m4a");
          if (existsSync(m4aPath)) {
            console.log("[downloadYouTubeAudio] Downloaded m4a successfully");
            resolve({ success: true, filePath: m4aPath });
          } else {
            // List files in outputDir to debug
            const fs = require("fs");
            const files = fs.readdirSync(outputDir);
            console.log("[downloadYouTubeAudio] Files in output dir:", files);

            // Try to find any audio file
            const audioFile = files.find(
              (f: string) =>
                f.startsWith("audio.") &&
                ![".jpg", ".png", ".tmp"].some((ext) => f.endsWith(ext))
            );

            if (audioFile) {
              const filePath = join(outputDir, audioFile);
              console.log("[downloadYouTubeAudio] Found audio file:", audioFile);
              resolve({ success: true, filePath });
            } else {
              resolve({
                success: false,
                error: "Downloaded file not found",
                filePath: undefined,
              });
            }
          }
        } else {
          // Detect specific error types from stderr
          const lowerError = (stderr + stdout).toLowerCase();

          // Copyright detection
          if (
            lowerError.includes("copyright") ||
            lowerError.includes("music licensing") ||
            lowerError.includes("content from") ||
            stderr.includes("ERROR 403") ||
            stderr.includes("403 Forbidden")
          ) {
            console.error("[downloadYouTubeAudio] Copyright strike detected");
            resolve({
              success: false,
              error: "Video contains copyrighted content",
            });
          }
          // Age restriction
          else if (lowerError.includes("age")) {
            resolve({
              success: false,
              error: "Video is age-restricted",
            });
          }
          // Geo-restriction
          else if (lowerError.includes("geo")) {
            resolve({
              success: false,
              error: "Video is geo-restricted",
            });
          }
          // Deleted
          else if (lowerError.includes("not found") || lowerError.includes("deleted")) {
            resolve({
              success: false,
              error: "Video not found",
            });
          }
          // Playback restrictions
          else if (lowerError.includes("playback") || lowerError.includes("embed")) {
            resolve({
              success: false,
              error: "Video playback is restricted",
            });
          }
          // Generic error
          else {
            console.error("[downloadYouTubeAudio] yt-dlp error:", {
              code,
              stderr,
              stdout,
            });
            resolve({
              success: false,
              error: stderr || stdout || "Download failed",
            });
          }
        }
      });

      proc.on("error", (error) => {
        clearTimeout(timeout);
        console.error("[downloadYouTubeAudio] Process error:", error);
        resolve({
          success: false,
          error: String(error),
        });
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error("[downloadYouTubeAudio] Catch error:", error);
      resolve({
        success: false,
        error: String(error),
      });
    }
  });
}

/**
 * Get audio duration using ffprobe
 */
export function getAudioDuration(filePath: string): number {
  try {
    const result = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1:noquote=1 "${filePath}"`,
      { encoding: "utf8" }
    );
    return Math.round(parseFloat(result)) || 0;
  } catch (error) {
    console.warn("[getAudioDuration] Error:", error);
    return 0;
  }
}
