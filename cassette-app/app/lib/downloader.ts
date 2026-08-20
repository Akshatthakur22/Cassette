import YTDlpWrap from "yt-dlp-wrap";
import { join } from "path";
import { existsSync } from "fs";
import { mkdir, stat, chmod, unlink } from "fs/promises";

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
  ];
  for (const p of possiblePaths) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

/**
 * Initializes and returns a cached YTDlpWrap instance.
 */
export async function getYtDlp(): Promise<YTDlpWrap> {
  if (ytDlpInstance) return ytDlpInstance;

  const binDir = join(process.cwd(), ".bin");
  await mkdir(binDir, { recursive: true });
  const binaryPath = join(binDir, "yt-dlp");

  if (!existsSync(binaryPath)) {
    console.log("[Downloader] Downloading latest yt-dlp binary...");
    await YTDlpWrap.downloadFromGithub(binaryPath);
    await chmod(binaryPath, 0o755);
    console.log("[Downloader] yt-dlp binary ready at:", binaryPath);
  }

  ytDlpInstance = new YTDlpWrap(binaryPath);
  return ytDlpInstance;
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
      const storageDir = join(process.cwd(), "public", "audio-library");
      await mkdir(storageDir, { recursive: true });

      const targetPath = join(storageDir, `${sanitizedId}.mp3`);
      const ytDlp = await getYtDlp();

      const videoUrl = `https://www.youtube.com/watch?v=${sanitizedId}`;

      let title = fallbackMeta?.title || "Audio Track";
      let artist = fallbackMeta?.artist || "YouTube Audio";
      let durationSec = fallbackMeta?.durationSec || 0;
      let thumbnailUrl =
        fallbackMeta?.thumbnailUrl || `https://i.ytimg.com/vi/${sanitizedId}/hqdefault.jpg`;

      // Construct args
      const ffmpegPath = getFfmpegLocation();
      const args = [
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
      ];

      if (ffmpegPath) {
        args.push("--ffmpeg-location", ffmpegPath);
      }

      args.push("-o", targetPath);

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

      const s = await stat(targetPath);
      if (s.size < 1024) {
        throw new Error(`Downloaded audio file is too small or corrupt (${s.size} bytes)`);
      }

      console.log(
        `[Downloader] Audio download complete for ${sanitizedId}: size=${s.size} bytes, format=mp3`
      );

      return {
        videoId: sanitizedId,
        title,
        artist,
        thumbnailUrl,
        durationSec,
        audioUrl: `/audio-library/${sanitizedId}.mp3`,
        mimeType: "audio/mpeg",
        fileSizeBytes: s.size,
      };
    } finally {
      // Clean up in-flight download map
      activeDownloads.delete(sanitizedId);
    }
  })();

  activeDownloads.set(sanitizedId, downloadPromise);
  return downloadPromise;
}
