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
      return new NextResponse("Audio file not found", { status: 404 });
    }

    const filePath = getAudioFilePath(sanitizedId, ext);
    const fileStats = await stat(filePath);
    const fileSize = fileStats.size;
    const mimeType = ext === "m4a" ? "audio/mp4" : "audio/mpeg";

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
