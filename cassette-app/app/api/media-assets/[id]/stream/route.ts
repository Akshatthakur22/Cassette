/** Stream a READY media asset from R2. Supports HEAD and byte-range requests. */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getR2Service } from "@/lib/storage/R2Service";

export const runtime = "nodejs";

async function getAsset(id: string) {
  return prisma.mediaAsset.findUnique({
    where: { id },
    select: { id: true, status: true, storageKey: true, mimeType: true, fileSize: true, error: true },
  });
}

function statusResponse(status: string, error?: string | null) {
  if (status === "FAILED" || status === "EXPIRED") {
    return NextResponse.json(
      { error: error || `Media asset is ${status.toLowerCase()}`, status },
      { status: 410, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
  return NextResponse.json(
    { error: `Track is being processed (${status}).`, status, retryAfter: 3000 },
    { status: 202, headers: { "Retry-After": "3", "Access-Control-Allow-Origin": "*" } }
  );
}

async function handle(request: NextRequest, id: string, headOnly = false) {
  if (!id) return NextResponse.json({ error: "Invalid media asset ID" }, { status: 400 });

  const asset = await getAsset(id);
  if (!asset) return NextResponse.json({ error: "Media asset not found" }, { status: 404 });
  if (asset.status !== "READY") {
    const pending = statusResponse(asset.status, asset.error);
    return headOnly
      ? new NextResponse(null, { status: pending.status, headers: pending.headers })
      : pending;
  }
  if (!asset.storageKey) return NextResponse.json({ error: "Storage key not available" }, { status: 500 });

  const headers = new Headers({
    "Content-Type": asset.mimeType || "audio/mpeg",
    "Cache-Control": "private, max-age=3600",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Range",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
    "Accept-Ranges": "bytes",
  });

  if (headOnly) {
    if (asset.fileSize != null) headers.set("Content-Length", String(asset.fileSize));
    return new NextResponse(null, { status: 200, headers });
  }

  const r2 = getR2Service();
  const signed = await r2.getSignedPlaybackUrl(asset.storageKey, 3600);
  if (!signed.success || !signed.url) {
    return NextResponse.json({ error: "Failed to generate playback URL" }, { status: 502 });
  }

  const range = request.headers.get("range");
  const upstream = await fetch(signed.url, {
    headers: range ? { Range: range } : undefined,
    signal: request.signal,
  });
  if (!upstream.ok && upstream.status !== 206 && upstream.status !== 416) {
    return NextResponse.json({ error: "Failed to fetch audio from storage" }, { status: 502 });
  }

  for (const name of ["content-length", "content-range", "accept-ranges", "last-modified", "etag"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await handle(request, id);
  } catch (error) {
    console.error("[media-assets stream] Error:", error);
    return NextResponse.json({ error: "Failed to stream audio" }, { status: 500 });
  }
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await handle(request, id, true);
  } catch (error) {
    console.error("[media-assets stream] HEAD error:", error);
    return NextResponse.json({ error: "Failed to check audio" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Range",
      "Access-Control-Max-Age": "86400",
    },
  });
}
