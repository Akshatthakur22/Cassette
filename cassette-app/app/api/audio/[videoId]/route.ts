import { NextRequest, NextResponse } from "next/server";
import { getAudioFilePath, audioFileExists } from "@/lib/storage/audio-storage";
import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await context.params;
    const sanitizedId = videoId.replace(/[^a-zA-Z0-9_-]/g, "");

    if (!sanitizedId) {
      return new NextResponse("Invalid video ID", { status: 400 });
    }

    // Check extensions
    let ext = "mp3";
    let exists = await audioFileExists(sanitizedId, "mp3");
    if (!exists) {
      exists = await audioFileExists(sanitizedId, "m4a");
      if (exists) ext = "m4a";
    }
    if (!exists) {
      exists = await audioFileExists(sanitizedId, "webm");
      if (exists) ext = "webm";
    }
    if (!exists) {
      exists = await audioFileExists(sanitizedId, "opus");
      if (exists) ext = "opus";
    }

    if (!exists) {
      // 1. Try to get direct audio stream URL via standalone extractor
      try {
        const { getDirectAudioStreamUrl } = await import("@/app/lib/downloader");
        const directUrl = await getDirectAudioStreamUrl(sanitizedId);
        if (directUrl) {
          console.log(`[api/audio] Redirecting to direct stream for ${sanitizedId}`);
          return NextResponse.redirect(directUrl, {
            status: 307,
            headers: {
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      } catch (directErr) {
        console.warn("[api/audio] Direct stream extraction error:", directErr);
      }

      // 2. Fallback to ytdl stream
      try {
        const ytdl = (await import("@distube/ytdl-core")).default;
        const videoUrl = `https://www.youtube.com/watch?v=${sanitizedId}`;
        const info = await ytdl.getInfo(videoUrl);
        const format = ytdl.chooseFormat(info.formats, {
          filter: "audioonly",
          quality: "highestaudio",
        });

        if (format && format.url) {
          const ytdlStream = ytdl.downloadFromInfo(info, { format });
          const webStream = Readable.toWeb(ytdlStream) as ReadableStream;
          return new NextResponse(webStream, {
            status: 200,
            headers: {
              "Content-Type": format.mimeType?.split(";")[0] || "audio/mp4",
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      } catch (streamErr) {
        console.warn("[api/audio] Dynamic stream error:", streamErr);
      }

      return new NextResponse("Audio file not found", { status: 404 });
    }

    const filePath = getAudioFilePath(sanitizedId, ext);
    const fileStats = await stat(filePath);
    const fileSize = fileStats.size;
    let mimeType = "audio/mpeg";
    if (ext === "m4a") mimeType = "audio/mp4";
    else if (ext === "webm") mimeType = "audio/webm";
    else if (ext === "opus") mimeType = "audio/opus";

    const range = request.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const chunksize = end - start + 1;
      const stream = createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(stream) as ReadableStream;

      return new NextResponse(webStream, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } else {
      const stream = createReadStream(filePath);
      const webStream = Readable.toWeb(stream) as ReadableStream;

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          "Content-Length": fileSize.toString(),
          "Content-Type": mimeType,
          "Accept-Ranges": "bytes",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (err) {
    console.error("[api/audio] Stream error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
