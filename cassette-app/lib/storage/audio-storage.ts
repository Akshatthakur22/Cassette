import { join } from "path";
import { tmpdir } from "os";
import { mkdir, stat, unlink, writeFile } from "fs/promises";
import { existsSync } from "fs";

const AUDIO_DIR_NAME = "audio-library";

export function isServerlessEnvironment(): boolean {
  return Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.NODE_ENV === "production"
  );
}

/**
 * Returns absolute directory path where audio files are stored.
 * On serverless (Vercel / Lambda), process.cwd() is read-only, so we use /tmp.
 */
export function getAudioStorageDir(): string {
  if (isServerlessEnvironment()) {
    return join(tmpdir(), AUDIO_DIR_NAME);
  }
  return join(process.cwd(), "public", AUDIO_DIR_NAME);
}

/**
 * Returns local filesystem path for a given video ID and extension.
 */
export function getAudioFilePath(videoId: string, ext = "mp3"): string {
  const sanitizedId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
  return join(getAudioStorageDir(), `${sanitizedId}.${ext}`);
}

/**
 * Returns public URL path for client playback.
 */
export function getAudioPublicUrl(videoId: string, _ext = "mp3"): string {
  const sanitizedId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");
  return `/api/audio/${sanitizedId}`;
}

/**
 * Check if the audio file physically exists on storage.
 */
export async function audioFileExists(videoId: string, ext = "mp3"): Promise<boolean> {
  const filepath = getAudioFilePath(videoId, ext);
  try {
    if (!existsSync(filepath)) return false;
    const s = await stat(filepath);
    return s.isFile() && s.size > 1024; // Ensure non-empty file (>1KB)
  } catch {
    return false;
  }
}

/**
 * Save audio buffer to the storage directory.
 */
export async function saveAudioFile(
  videoId: string,
  buffer: Buffer,
  ext = "mp3"
): Promise<{ filepath: string; publicUrl: string; sizeBytes: number }> {
  const dir = getAudioStorageDir();
  await mkdir(dir, { recursive: true });

  const filepath = getAudioFilePath(videoId, ext);
  await writeFile(filepath, buffer);

  const s = await stat(filepath);
  return {
    filepath,
    publicUrl: getAudioPublicUrl(videoId, ext),
    sizeBytes: s.size,
  };
}

/**
 * Delete audio file if it exists.
 */
export async function deleteAudioFile(videoId: string, ext = "mp3"): Promise<boolean> {
  const filepath = getAudioFilePath(videoId, ext);
  try {
    if (existsSync(filepath)) {
      await unlink(filepath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
