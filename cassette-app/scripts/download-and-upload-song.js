#!/usr/bin/env node

/**
 * Manual Download and Upload Script
 * Downloads a song from YouTube and uploads it directly via the fast-track endpoint
 * Usage: node scripts/download-and-upload-song.js <videoId> [title] [artist]
 * 
 * Examples:
 * node scripts/download-and-upload-song.js "EaaeuLFk5rg" "Tere Bin" "Atif Aslam"
 * node scripts/download-and-upload-song.js "mW1h0UeysDg"
 */

const { spawn, execSync } = require("child_process");
const fs = require("fs").promises;
const path = require("path");
const FormData = require("form-data");
const fetch = require("node-fetch");
const { nanoid } = require("nanoid");

const TEMP_DIR = "/tmp/cassette-manual-download";
const UPLOAD_ENDPOINT = "https://cassette-share.vercel.app/api/media-assets/upload";

async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

function downloadAudio(videoId, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading audio from YouTube (${videoId})...`);

    const proc = spawn("yt-dlp", [
      "--no-warnings",
      "-f",
      "bestaudio[ext=m4a]/bestaudio",
      "-x",
      "--audio-format",
      "m4a",
      "-o",
      outputPath,
      `https://www.youtube.com/watch?v=${videoId}`,
    ]);

    let stderr = "";

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Download complete");
        resolve();
      } else {
        reject(new Error(`yt-dlp failed: ${stderr}`));
      }
    });

    proc.on("error", (error) => {
      reject(error);
    });
  });
}

function convertToMP3(inputPath, outputPath, bitrate = 64) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Converting to MP3 (${bitrate}kbps)...`);

    const proc = spawn("ffmpeg", [
      "-i",
      inputPath,
      "-b:a",
      `${bitrate}k`,
      "-ar",
      "22050",
      "-ac",
      "1",
      "-codec:a",
      "libmp3lame",
      "-q:a",
      "9",
      "-f",
      "mp3",
      outputPath,
    ]);

    let stderr = "";

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Conversion complete");
        resolve();
      } else {
        reject(new Error(`FFmpeg failed: ${stderr}`));
      }
    });

    proc.on("error", (error) => {
      reject(error);
    });
  });
}

async function uploadToServer(mp3Path, title, artist) {
  console.log(`📤 Uploading to Cassette server...`);

  const form = new FormData();
  const fileStream = fs.createReadStream(mp3Path);
  const stats = await fs.stat(mp3Path);

  form.append("file", fileStream, {
    filename: "song.mp3",
    contentType: "audio/mpeg",
  });
  form.append("title", title);
  if (artist) {
    form.append("artist", artist);
  }

  try {
    const response = await fetch(UPLOAD_ENDPOINT, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Upload failed");
    }

    console.log("✅ Upload complete");
    return result;
  } catch (error) {
    throw new Error(`Upload error: ${error.message}`);
  }
}

function getYouTubeTitle(videoId) {
  try {
    const result = execSync(
      `yt-dlp --no-warnings --print "%(title)s" "https://www.youtube.com/watch?v=${videoId}"`,
      { encoding: "utf8" }
    );
    return result.trim();
  } catch (error) {
    return null;
  }
}

async function main() {
  const videoId = process.argv[2];
  let title = process.argv[3];
  const artist = process.argv[4];

  console.log("=".repeat(80));
  console.log("CASSETTE: MANUAL DOWNLOAD & UPLOAD");
  console.log("=".repeat(80));
  console.log("");

  if (!videoId) {
    console.error("❌ Usage: node scripts/download-and-upload-song.js <videoId> [title] [artist]");
    console.error("   Example: node scripts/download-and-upload-song.js EaaeuLFk5rg 'Tere Bin' 'Atif Aslam'");
    process.exit(1);
  }

  try {
    await ensureTempDir();

    // Get title from YouTube if not provided
    if (!title) {
      console.log("🔍 Fetching song title from YouTube...");
      title = getYouTubeTitle(videoId);
      if (!title) {
        console.error("❌ Could not fetch title from YouTube. Please provide it manually.");
        process.exit(1);
      }
      console.log(`   Title: ${title}`);
    }

    const sessionId = nanoid();
    const audioPath = path.join(TEMP_DIR, `audio-${sessionId}.m4a`);
    const mp3Path = path.join(TEMP_DIR, `song-${sessionId}.mp3`);

    console.log(`\n📝 Starting download and upload process...`);
    console.log(`   Video ID: ${videoId}`);
    console.log(`   Title: ${title}`);
    if (artist) console.log(`   Artist: ${artist}`);
    console.log("");

    // Step 1: Download
    await downloadAudio(videoId, audioPath);

    // Step 2: Convert to MP3
    await convertToMP3(audioPath, mp3Path, 64);

    // Step 3: Upload
    const uploadResult = await uploadToServer(mp3Path, title, artist);

    console.log("\n" + "=".repeat(80));
    console.log("✅ SUCCESS! Song is now ready to play");
    console.log("=".repeat(80));
    console.log("");
    console.log("📊 Upload Details:");
    console.log(`   Media Asset ID: ${uploadResult.mediaAssetId}`);
    console.log(`   Title: ${uploadResult.title}`);
    console.log(`   Artist: ${uploadResult.artist || "N/A"}`);
    console.log(`   Status: ${uploadResult.status}`);
    console.log(`   File Size: ${(uploadResult.fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Duration: ${uploadResult.durationSec}s`);
    console.log("");
    console.log("🎵 Playback URL:");
    console.log(`   ${uploadResult.playbackUrl}`);
    console.log("");
    console.log("✨ You can now add this song to your tapes!");
    console.log("=".repeat(80));

    // Cleanup temp files
    try {
      await fs.unlink(audioPath);
      await fs.unlink(mp3Path);
    } catch (cleanupError) {
      console.warn("⚠️  Warning: Could not clean up temp files");
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

main();
