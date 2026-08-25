/**
 * GET /api/media-assets/[id]/stream
 * Stream MP3 audio with CORS headers for browser playback
 * Proxies R2 URL with proper Access-Control headers
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getR2Service } from "@/lib/storage/R2Service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: mediaAssetId } = await params;

    if (!mediaAssetId || typeof mediaAssetId !== "string") {
      return NextResponse.json(
        { error: "Invalid media asset ID" },
        { status: 400 }
      );
    }

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: {
        id: true,
        status: true,
        storageKey: true,
        mimeType: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: "Media asset not found" },
        { status: 404 }
      );
    }

    if (asset.status === "FAILED") {
      return NextResponse.json(
        { 
          error: "This track failed to process. Please try adding it again.",
          status: asset.status,
        },
        { 
          status: 410,  // 410 Gone - won't be available
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    if (asset.status === "EXPIRED") {
      return NextResponse.json(
        { 
          error: "This track has expired and is no longer available.",
          status: asset.status,
        },
        { 
          status: 410,  // 410 Gone - won't be available
          headers: {
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    if (asset.status !== "READY") {
      // Return 202 Accepted for pending/processing assets
      // Frontend should retry after a delay
      return NextResponse.json(
        { 
          error: `Track is being processed (status: ${asset.status}). Please wait...`,
          status: asset.status,
          retryAfter: 3000 // Suggest retry after 3 seconds
        },
        { 
          status: 202,
          headers: {
            "Retry-After": "3", // HTTP standard for retry-able responses
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    if (!asset.storageKey) {
      return NextResponse.json(
        { error: "Storage key not available" },
        { status: 500 }
      );
    }

    try {
      // Get presigned URL from R2
      const r2Service = getR2Service();
      const urlResult = await r2Service.getSignedPlaybackUrl(asset.storageKey, 3600);

      if (!urlResult.success || !urlResult.url) {
        return NextResponse.json(
          { error: "Failed to generate playback URL" },
          { status: 500 }
        );
      }

      // Fetch the audio from R2
      const audioResponse = await fetch(urlResult.url);

      if (!audioResponse.ok) {
        return NextResponse.json(
          { error: "Failed to fetch audio from storage" },
          { status: 500 }
        );
      }

      // Get audio data
      const audioBuffer = await audioResponse.arrayBuffer();

      // Return with CORS headers
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": asset.mimeType || "audio/mpeg",
          "Content-Length": String(audioBuffer.byteLength),
          "Cache-Control": "public, max-age=86400", // 24 hours
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Range",
          "Access-Control-Expose-Headers": "Content-Length, Content-Range",
          "Accept-Ranges": "bytes",
        },
      });
    } catch (error) {
      console.error("[media-assets stream] R2 error:", error);
      return NextResponse.json(
        { error: "Failed to stream audio" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[media-assets stream] Error:", error);
    return NextResponse.json(
      { error: "Failed to stream audio" },
      { status: 500 }
    );
  }
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
      "Access-Control-Max-Age": "86400",
    },
  });
}
