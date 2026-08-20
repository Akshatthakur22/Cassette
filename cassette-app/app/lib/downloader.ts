import YTDlpWrap from "yt-dlp-wrap";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir, stat, chmod, unlink } from "fs/promises";

import { tmpdir } from "os";
import {
  getAudioStorageDir,
  getAudioFilePath,
  getAudioPublicUrl,
  isServerlessEnvironment,
} from "@/lib/storage/audio-storage";

export interface DownloadedAudioResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  durationSec: number;
  audioUrl: string;
  mimeType: string;
  fileSizeBytes: number;
}

// In-flight download mutex map to prevent duplicate concurrent downloads for the same videoId
const activeDownloads = new Map<string, Promise<DownloadedAudioResult>>();
let ytDlpInstance: YTDlpWrap | null = null;

function getFfmpegLocation(): string | undefined {
  const possiblePaths = [
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg",
    "/usr/bin/ffmpeg",
    "/var/task/node_modules/@ffmpeg-installer/ffmpeg/ffmpeg",
  ];
  for (const p of possiblePaths) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

import https from "https";
import { createWriteStream } from "fs";

export function getStandaloneBinaryName(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "linux") {
    return arch === "arm64" ? "yt-dlp_linux_aarch64" : "yt-dlp_linux";
  }
  if (platform === "darwin") {
    return "yt-dlp_macos";
  }
  if (platform === "win32") {
    return "yt-dlp.exe";
  }
  return "yt-dlp";
}

async function downloadYtDlpStandalone(targetPath: string): Promise<void> {
  const binaryName = getStandaloneBinaryName();
  const downloadUrl = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${binaryName}`;
  console.log(`[Downloader] Downloading standalone binary ${binaryName} to ${targetPath}...`);

  await new Promise<void>((resolve, reject) => {
    function fetchUrl(url: string) {
      https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchUrl(res.headers.location);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download binary: HTTP ${res.statusCode}`));
          return;
        }
        const fileStream = createWriteStream(targetPath);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
        fileStream.on("error", reject);
      }).on("error", reject);
    }
    fetchUrl(downloadUrl);
  });

  await chmod(targetPath, 0o755);
  console.log(`[Downloader] Standalone binary ready at ${targetPath}`);
}

/**
 * Initializes and returns a cached YTDlpWrap instance using standalone compiled binaries.
 */
export async function getYtDlp(): Promise<YTDlpWrap> {
  if (ytDlpInstance) return ytDlpInstance;

  const binDir = isServerlessEnvironment()
    ? join(tmpdir(), "cassette-bin")
    : join(process.cwd(), ".bin");
  await mkdir(binDir, { recursive: true });
  const binaryPath = join(binDir, getStandaloneBinaryName());

  if (!existsSync(binaryPath)) {
    await downloadYtDlpStandalone(binaryPath);
  }

  ytDlpInstance = new YTDlpWrap(binaryPath);
  return ytDlpInstance;
}

/**
 * Extracts direct high-speed audio stream URL from YouTube.
 */
export async function getDirectAudioStreamUrl(videoId: string): Promise<string | null> {
  try {
    const ytDlp = await getYtDlp();
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const output = await ytDlp.execPromise([
      videoUrl,
      "-g",
      "-f",
      "ba/b",
      "--no-playlist",
      "--no-warnings",
    ]);
    const urls = output.trim().split("\n").map((u) => u.trim()).filter(Boolean);
    return urls[0] || null;
  } catch (err) {
    console.warn(`[Downloader] Failed to get direct stream URL for ${videoId}:`, err);
    return null;
  }
}

/**
 * Downloads audio stream for a given YouTube videoId and saves it to storage.
 * Deduplicates in-flight requests so simultaneous calls share a single download execution.
 */
export async function downloadYouTubeAudio(
  videoId: string,
  fallbackMeta?: {
    title?: string;
    artist?: string;
    thumbnailUrl?: string;
    durationSec?: number;
  }
): Promise<DownloadedAudioResult> {
  const sanitizedId = videoId.trim().replace(/[^a-zA-Z0-9_-]/g, "");
  if (!sanitizedId || sanitizedId.length < 5) {
    throw new Error(`Invalid videoId: ${videoId}`);
  }

  // 1. Check if already actively downloading
  const inFlight = activeDownloads.get(sanitizedId);
  if (inFlight) {
    console.log(`[Downloader] Attaching to in-flight download for ${sanitizedId}`);
    return inFlight;
  }

  // 2. Start new download promise and track in map
  const downloadPromise = (async () => {
    try {
      console.log(`[Downloader] Starting audio download for videoId: ${sanitizedId}`);
      const storageDir = getAudioStorageDir();
      try {
        await mkdir(storageDir, { recursive: true });
      } catch {}

      const videoUrl = `https://www.youtube.com/watch?v=${sanitizedId}`;

      let title = fallbackMeta?.title || "Audio Track";
      let artist = fallbackMeta?.artist || "YouTube Audio";
      let durationSec = fallbackMeta?.durationSec || 0;
      let thumbnailUrl =
        fallbackMeta?.thumbnailUrl || `https://i.ytimg.com/vi/${sanitizedId}/hqdefault.jpg`;

      // Try pure JS metadata extraction first if fallbackMeta is incomplete
      try {
        const ytdl = (await import("@distube/ytdl-core")).default;
        const basicInfo = await ytdl.getBasicInfo(videoUrl);
        if (basicInfo?.videoDetails) {
          title = basicInfo.videoDetails.title || title;
          artist = basicInfo.videoDetails.author?.name || artist;
          const parsedSec = parseInt(basicInfo.videoDetails.lengthSeconds, 10);
          if (parsedSec > 0) durationSec = parsedSec;
          const thumbs = basicInfo.videoDetails.thumbnails;
          if (thumbs && thumbs.length > 0) {
            thumbnailUrl = thumbs[thumbs.length - 1].url || thumbnailUrl;
          }
        }
      } catch (e) {
        console.debug("[Downloader] ytdl info fetch note:", e);
      }

      // Attempt yt-dlp binary download if available
      try {
        const ytDlp = await getYtDlp();
        const ffmpegPath = getFfmpegLocation();
        let targetPath = getAudioFilePath(sanitizedId, "mp3");
        let args: string[];

        if (ffmpegPath) {
          args = [
            videoUrl,
            "-f",
            "ba/b",
            "-x",
            "--audio-format",
            "mp3",
            "--audio-quality",
            "0",
            "--no-playlist",
            "--no-warnings",
            "--ffmpeg-location",
            ffmpegPath,
            "-o",
            targetPath,
          ];
        } else {
          // Without ffmpeg, download native stream container (m4a/webm/mp3)
          const templatePath = join(storageDir, `${sanitizedId}.%(ext)s`);
          args = [
            videoUrl,
            "-f",
            "ba/b",
            "--no-playlist",
            "--no-warnings",
            "-o",
            templatePath,
          ];
        }

        // Clean up any stale partial target
        try {
          if (existsSync(targetPath)) {
            const checkStat = await stat(targetPath);
            if (checkStat.size < 1024) {
              await unlink(targetPath);
            }
          }
        } catch {}

        // Execute download
        await ytDlp.execPromise(args);

        // Identify the created file
        let finalPath = targetPath;
        let finalExt = "mp3";
        if (!existsSync(finalPath)) {
          for (const candidateExt of ["m4a", "webm", "opus", "mp3"]) {
            const checkPath = getAudioFilePath(sanitizedId, candidateExt);
            if (existsSync(checkPath)) {
              finalPath = checkPath;
              finalExt = candidateExt;
              break;
            }
          }
        }

        if (existsSync(finalPath)) {
          const s = await stat(finalPath);
          if (s.size >= 1024) {
            let mimeType = "audio/mpeg";
            if (finalExt === "m4a") mimeType = "audio/mp4";
            else if (finalExt === "webm") mimeType = "audio/webm";
            else if (finalExt === "opus") mimeType = "audio/opus";

            console.log(
              `[Downloader] Audio download complete for ${sanitizedId}: size=${s.size} bytes, format=${finalExt}`
            );

            return {
              videoId: sanitizedId,
              title,
              artist,
              thumbnailUrl,
              durationSec,
              audioUrl: getAudioPublicUrl(sanitizedId, finalExt),
              mimeType,
              fileSizeBytes: s.size,
            };
          }
        }
      } catch (binErr) {
        console.warn("[Downloader] Binary downloader note:", binErr);
      }

      // If binary download did not run (e.g. serverless lambda without binary support),
      // return streaming URL to /api/audio/[videoId] which streams via pure JS
      return {
        videoId: sanitizedId,
        title,
        artist,
        thumbnailUrl,
        durationSec,
        audioUrl: getAudioPublicUrl(sanitizedId, "mp3"),
        mimeType: "audio/mpeg",
        fileSizeBytes: 0,
      };
    } finally {
      // Clean up in-flight download map
      activeDownloads.delete(sanitizedId);
    }
  })();

  activeDownloads.set(sanitizedId, downloadPromise);
  return downloadPromise;
}
