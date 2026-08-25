"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/app/lib/prisma";
import { generatePublicId, generateDraftToken, DRAFT_COOKIE } from "@/app/lib/tokens";
import type { TapeStyle, TapeRelationship, TrackInput } from "@/app/lib/types";
import { checkContentForSpam, checkForDuplicates } from "@/app/lib/safety";

type VerifiedTape = Prisma.TapeGetPayload<{
  select: {
    id: true;
    draftToken: true;
    status: true;
    title: true;
    dedication: true;
    senderName: true;
    recipientName: true;
    relationship: true;
    style: true;
    visibility: true;
    memoryDate: true;
    publicId: true;
    createdAt: true;
    updatedAt: true;
    deletedAt: true;
  };
}>;

type PublicTape = Prisma.TapeGetPayload<{
  include: {
    tracks: true;
  };
}>;

type PublicShelfTape = Prisma.TapeGetPayload<{
  select: {
    publicId: true;
    title: true;
    senderName: true;
    recipientName: true;
    style: true;
  };
}>;

type DraftTokenTape = Prisma.TapeGetPayload<{
  include: {
    tracks: true;
  };
}>;

/** Extract the real client IP from common proxy headers */
async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    hdrs.get("cf-connecting-ip") || // Cloudflare
    ""
  );
}

// ─── helpers ────────────────────────────────────────────────────────────────

async function getVerifiedTape(draftId: string): Promise<VerifiedTape | null> {
  const jar = await cookies();
  const token = jar.get(DRAFT_COOKIE)?.value;
  if (!token) return null;

  const tape = await prisma.tape.findUnique({ 
    where: { id: draftId },
    select: {
      id: true,
      draftToken: true,
      status: true,
      title: true,
      dedication: true,
      senderName: true,
      recipientName: true,
      relationship: true,
      style: true,
      visibility: true,
      memoryDate: true,
      publicId: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    }
  });
  if (!tape || tape.draftToken !== token) return null;
  if (tape.status === "deleted") return null;
  return tape;
}

// ─── createDraft ────────────────────────────────────────────────────────────

export async function createDraft(formData: FormData) {
  const senderName    = (formData.get("senderName")    as string | null)?.trim() ?? "";
  const relationship  = (formData.get("relationship")  as TapeRelationship | null) ?? "other";
  const style         = (formData.get("style")         as TapeStyle | null) ?? "classic";
  const recipientName = (formData.get("recipientName") as string | null)?.trim() || null;
  const title         = (formData.get("title")         as string | null)?.trim() || null;
  const dedication    = (formData.get("dedication")    as string | null)?.trim().slice(0, 500) || null;
  const createdFromTapeId = (formData.get("fromTapeId") as string | null) || null;
  const visibility    = (formData.get("visibility")    as string | null) === "public" ? "public" : "unlisted";

  if (!senderName) {
    return { error: "Please enter your name." };
  }

  // ── Rate limiting: 10 drafts per session + per IP per hour ──────────────
  const jar = await cookies();
  let sessionId = jar.get("session_id")?.value;
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    jar.set("session_id", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  const ip = await getClientIp();
  const { checkRateLimit } = await import("@/app/lib/rate-limit");
  const rl = checkRateLimit(`draft:${sessionId}`, ip, 10, 60 * 60 * 1000);

  if (!rl.allowed) {
    const mins = Math.ceil(rl.retryAfterSec / 60);
    return {
      error: `Too many tapes created. Please wait ${mins} minute${mins !== 1 ? "s" : ""} before trying again.`,
      retryAfterSec: rl.retryAfterSec,
    };
  }

  const publicId   = generatePublicId();
  const draftToken = generateDraftToken();

  const tape = await prisma.tape.create({
    data: {
      publicId,
      draftToken,
      senderName,
      recipientName,
      title,
      dedication,
      relationship,
      style,
      visibility,
      status: "draft",
      createdFromTapeId,
    },
  });

  // Set the draft-token cookie (httpOnly, 30 day expiry)
  jar.set(DRAFT_COOKIE, draftToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  // Track tape creation started
  const { trackEvent, EVENTS } = await import("@/app/lib/posthog");
  trackEvent(tape.senderName, EVENTS.TAPE_CREATED, {
    tapeId: tape.publicId,
    style,
    relationship,
    hasRecipient: !!recipientName,
    isReply: !!createdFromTapeId,
  }).catch(err => console.warn("PostHog tracking error:", err));

  redirect(`/create/${tape.id}`);
}

// ─── updateTapeMeta ─────────────────────────────────────────────────────────

export async function updateTapeMeta(draftId: string, formData: FormData) {
  const tape = await getVerifiedTape(draftId);
  if (!tape) return { error: "Unauthorized or tape not found." };

  const title         = (formData.get("title")         as string | null)?.trim() ?? null;
  const recipientName = (formData.get("recipientName") as string | null)?.trim() ?? null;
  const dedication    = (formData.get("dedication")    as string | null)?.trim().slice(0, 500) ?? null;
  const style         = (formData.get("style")         as TapeStyle | null) ?? tape.style as TapeStyle;
  const visibility    = (formData.get("visibility")    as string | null) ?? tape.visibility;

  await prisma.tape.update({
    where: { id: draftId },
    data: { title, recipientName, dedication, style, visibility },
  });

  return { ok: true };
}

// ─── addTrack ────────────────────────────────────────────────────────────────

export async function addTrack(draftId: string, track: TrackInput) {
  const tape = await getVerifiedTape(draftId);
  if (!tape) return { error: "Unauthorized." };

  // ──── VALIDATION 1: Track duration constraints ────────────────────────────
  const {
    validateTrackDuration,
    validateTapeCapacity,
    canFitOnSide,
  } = await import("@/app/lib/audio-validation");

  const durationValidation = validateTrackDuration(track.durationSec);
  if (!durationValidation.valid) {
    return { error: durationValidation.error };
  }

  // ──── VALIDATION 2: Check side capacity ──────────────────────────────────
  const sideCount = await prisma.tapeTrack.count({
    where: { tapeId: draftId, side: track.side },
  });

  const sideTracks = await prisma.tapeTrack.findMany({
    where: { tapeId: draftId, side: track.side },
    select: { durationSec: true },
  });

  const totalSideDuration = sideTracks.reduce((sum, t) => sum + (t.durationSec || 0), 0);
  const capacityCheck = canFitOnSide(
    totalSideDuration,
    track.durationSec || 0,
    sideCount
  );

  if (!capacityCheck.canFit) {
    return { error: capacityCheck.reason };
  }

  let durationSec = track.durationSec;
  let trackTitle = track.title;
  let trackArtist = track.artist ?? null;
  let trackThumbnail = track.thumbnailUrl ?? null;
  let mediaAssetId: string | null = null;

  if ((!track.provider || track.provider === "youtube") && track.providerTrackId) {
    try {
      const { validateYouTubeVideo } = await import("@/app/lib/youtube-enhanced");
      const validation = await validateYouTubeVideo(track.providerTrackId);
      if (!validation.isValid) {
        return { error: validation.error || "This YouTube video is unavailable or restricted." };
      }

      // ──── VALIDATION 3: Double-check duration after YouTube validation ────
      if (validation.durationSec) {
        durationSec = validation.durationSec;
        const recheck = validateTrackDuration(durationSec);
        if (!recheck.valid) {
          return { error: recheck.error };
        }
      }

      if (validation.thumbnailUrl && !trackThumbnail) {
        trackThumbnail = validation.thumbnailUrl;
      }
      if (validation.channelTitle && !trackArtist) {
        trackArtist = validation.channelTitle;
      }

      // ──── NEW: Create MediaAsset for YouTube tracks ─────────────────────────
      const {
        findExistingMediaAsset,
        createMediaAsset,
        triggerMediaAssetProcessing,
      } = await import("@/app/lib/media-asset");

      // Check if we already have a processing job for this video
      const existing = await findExistingMediaAsset(track.providerTrackId);
      if (existing) {
        mediaAssetId = existing.id;
      } else {
        // Create new MediaAsset job
        const asset = await createMediaAsset(
          track.providerTrackId,
          trackTitle,
          trackArtist,
          durationSec ?? 0
        );
        mediaAssetId = asset.id;
        console.log("[addTrack] Created MediaAsset job:", {
          mediaAssetId: asset.id,
          videoId: track.providerTrackId,
          title: trackTitle,
          durationSec,
        });

        // Immediately trigger processing (don't wait for polling cycle)
        triggerMediaAssetProcessing(asset.id).catch(() => {
          // If trigger fails, worker will pick it up in next cycle
          console.debug("[addTrack] Worker trigger skipped, will poll later");
        });
      }
      // ──────────────────────────────────────────────────────────────────────
    } catch (e) {
      console.warn("[addTrack] Validation warning:", e);
    }
  }

  const created = await prisma.tapeTrack.create({
    data: {
      tapeId:          draftId,
      side:            track.side,
      position:        track.position,
      title:           trackTitle,
      artist:          trackArtist,
      thumbnailUrl:    trackThumbnail,
      provider:        mediaAssetId ? "media_asset" : (track.provider ?? "youtube"),
      providerTrackId: mediaAssetId ?? track.providerTrackId,
      mediaAssetId:    mediaAssetId,
      personalNote:    track.personalNote?.slice(0, 280) ?? null,
      durationSec:     durationSec ?? null,
    },
  });

  // Track the event
  const { trackEvent, EVENTS } = await import("@/app/lib/posthog");
  trackEvent(tape.senderName, EVENTS.TRACK_ADDED, {
    side: track.side,
    title: track.title,
    provider: created.provider,
    mediaAssetId: mediaAssetId ? created.provider : undefined,
    durationSec: durationSec,
  }).catch(err => console.warn("PostHog tracking error:", err));

  return { ok: true, track: created, mediaAssetId };
}

// ─── addTracksFromPlaylist ──────────────────────────────────────────────────

export async function addTracksFromPlaylist(
  draftId: string,
  playlistId: string,
  playlistName: string,
  playlistUrl: string,
  items: Array<{ videoId: string; title: string; channelTitle?: string; thumbnail?: string; durationSec?: number }>
) {
  const tape = await getVerifiedTape(draftId);
  if (!tape) return { error: "Unauthorized." };

  if (items.length === 0) {
    return { error: "No items to add." };
  }

  // Get current track counts per side
  const sideACounts = await prisma.tapeTrack.findMany({
    where: { tapeId: draftId, side: "A" },
    select: { position: true },
    orderBy: { position: "desc" },
    take: 1,
  });
  const sideBCounts = await prisma.tapeTrack.findMany({
    where: { tapeId: draftId, side: "B" },
    select: { position: true },
    orderBy: { position: "desc" },
    take: 1,
  });

  let sideAPos = sideACounts.length > 0 ? sideACounts[0].position + 1 : 0;
  let sideBPos = sideBCounts.length > 0 ? sideBCounts[0].position + 1 : 0;

  const createdTracks = [];
  const mediaAssetIds: string[] = [];

  // Import once, outside loop
  const {
    findExistingMediaAsset,
    createMediaAsset,
    triggerMediaAssetProcessing,
  } = await import("@/app/lib/media-asset");

  for (const item of items) {
    // Try to add to whichever side has fewer tracks
    let side: "A" | "B";
    let position: number;

    if (sideAPos < 12 && sideAPos <= sideBPos) {
      side = "A";
      position = sideAPos;
      sideAPos++;
    } else if (sideBPos < 12) {
      side = "B";
      position = sideBPos;
      sideBPos++;
    } else {
      // Both sides full, skip
      continue;
    }

    let mediaAssetId: string | null = null;

    // Create MediaAsset for YouTube track
    try {
      const existing = await findExistingMediaAsset(item.videoId);
      if (existing) {
        mediaAssetId = existing.id;
      } else {
        const asset = await createMediaAsset(
          item.videoId,
          item.title,
          item.channelTitle ?? null,
          item.durationSec ?? 0
        );
        mediaAssetId = asset.id;

        // Immediately trigger processing
        triggerMediaAssetProcessing(asset.id).catch(() => {
          console.debug(`[addTracksFromPlaylist] Worker trigger skipped for ${asset.id}`);
        });
      }
    } catch (err) {
      console.warn(`[addTracksFromPlaylist] MediaAsset creation failed for ${item.videoId}:`, err);
    }

    const created = await prisma.tapeTrack.create({
      data: {
        tapeId:          draftId,
        side,
        position,
        title:           item.title,
        artist:          item.channelTitle ?? null,
        thumbnailUrl:    item.thumbnail ?? null,
        provider:        mediaAssetId ? "media_asset" : "youtube",
        providerTrackId: mediaAssetId ?? item.videoId,
        mediaAssetId:    mediaAssetId,
        durationSec:     item.durationSec ?? null,
      },
    });

    createdTracks.push(created);
    if (mediaAssetId) {
      mediaAssetIds.push(mediaAssetId);
    }
  }

  await prisma.tape.update({
    where: { id: draftId },
    data: {
      playlistSourceId: playlistId,
      playlistSourceUrl: playlistUrl,
      playlistName,
    },
  });

  // Track the event
  const { trackEvent, EVENTS } = await import("@/app/lib/posthog");
  trackEvent(tape.senderName, EVENTS.TRACK_ADDED, {
    source: "playlist",
    playlistName,
    count: createdTracks.length,
  }).catch(err => console.warn("PostHog tracking error:", err));

  return { ok: true, count: createdTracks.length, tracks: createdTracks };
}

// ─── updateTrackNote ────────────────────────────────────────────────────────

export async function updateTrackNote(draftId: string, trackId: string, note: string) {
  const tape = await getVerifiedTape(draftId);
  if (!tape) return { error: "Unauthorized." };

  await prisma.tapeTrack.updateMany({
    where: { id: trackId, tapeId: draftId },
    data: { personalNote: note.slice(0, 280) },
  });

  return { ok: true };
}

// ─── deleteTrack ────────────────────────────────────────────────────────────

export async function deleteTrack(draftId: string, trackId: string) {
  const tape = await getVerifiedTape(draftId);
  if (!tape) return { error: "Unauthorized." };

  // Get the side of the track being deleted
  const deletedTrack = await prisma.tapeTrack.findFirst({
    where: { id: trackId, tapeId: draftId },
    select: { side: true },
  });

  if (!deletedTrack) return { error: "Track not found." };

  // Delete the track
  await prisma.tapeTrack.delete({ where: { id: trackId } });

  // Re-number remaining tracks on that specific side only
  const remaining = await prisma.tapeTrack.findMany({
    where: { tapeId: draftId, side: deletedTrack.side },
    orderBy: { position: "asc" },
  });

  for (let i = 0; i < remaining.length; i++) {
    await prisma.tapeTrack.update({
      where: { id: remaining[i].id },
      data: { position: i },
    });
  }

  return { ok: true };
}

// ─── reorderTracks ──────────────────────────────────────────────────────────

export async function reorderTracks(
  draftId: string,
  side: "A" | "B",
  orderedIds: string[]
) {
  const tape = await getVerifiedTape(draftId);
  if (!tape) return { error: "Unauthorized." };

  // Validate all IDs belong to this tape and side
  const tracks = await prisma.tapeTrack.findMany({
    where: { tapeId: draftId, side },
    select: { id: true },
  });
  const validIds = new Set(tracks.map(t => t.id));

  for (const id of orderedIds) {
    if (!validIds.has(id)) {
      return { error: "Invalid track ID for this side." };
    }
  }

  // Update positions
  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.tapeTrack.update({
        where: { id },
        data: { position: idx },
      })
    )
  );

  return { ok: true };
}

// ─── publishTape ────────────────────────────────────────────────────────────

export async function publishTape(draftId: string) {
  const tape = await getVerifiedTape(draftId);
  if (!tape) return { error: "Unauthorized." };

  if (!tape.senderName) return { error: "Please add your name before publishing." };

  const trackCount = await prisma.tapeTrack.count({ where: { tapeId: draftId } });
  if (trackCount === 0) return { error: "Add at least one track before publishing." };

  // Check for spam/malicious content
  const spamCheck = checkContentForSpam(tape.title, tape.dedication, tape.senderName);
  if (spamCheck.isSpam) {
    return { 
      error: "Your tape was flagged as potentially spam. Please review the content and try again.",
      reason: spamCheck.reason 
    };
  }

  // Check for duplicates
  const { isDuplicate } = await checkForDuplicates(tape.senderName, tape.title);
  if (isDuplicate) {
    return { 
      error: "You've recently created a very similar tape. Please make sure your tape is unique."
    };
  }

  await prisma.tape.update({
    where: { id: draftId },
    data: { status: "published" },
  });

  // Track the event
  const { trackEvent, EVENTS } = await import("@/app/lib/posthog");
  trackEvent(tape.senderName, EVENTS.TAPE_PUBLISHED, {
    tapeId: tape.publicId,
    trackCount,
    style: tape.style,
    spamScore: spamCheck.score,
  }).catch(err => console.warn("PostHog tracking error:", err));

  return { ok: true, publicId: tape.publicId };
}

// ─── deleteTape ─────────────────────────────────────────────────────────────

export async function deleteTape(draftId: string) {
  const tape = await getVerifiedTape(draftId);
  if (!tape) return { error: "Unauthorized." };

  await prisma.tape.update({
    where: { id: draftId },
    data: { status: "deleted", deletedAt: new Date() },
  });

  const jar = await cookies();
  jar.delete(DRAFT_COOKIE);

  redirect("/");
}

// ─── getTapeForEditor ────────────────────────────────────────────────────────

export async function getTapeForEditor(draftId: string) {
  const tape = await getVerifiedTape(draftId);
  if (!tape) return null;

  const tracks = await prisma.tapeTrack.findMany({
    where: { tapeId: draftId },
    orderBy: [{ side: "asc" }, { position: "asc" }],
    select: {
      id: true,
      tapeId: true,
      side: true,
      position: true,
      title: true,
      artist: true,
      thumbnailUrl: true,
      provider: true,
      providerTrackId: true,
      personalNote: true,
      durationSec: true,
      createdAt: true,
    },
  });

  return { ...tape, tracks };
}

// ─── getTapeByDraftToken (for creator management) ───────────────────────────

export async function getTapeByDraftToken(draftToken: string): Promise<DraftTokenTape | null> {
  const tape = await prisma.tape.findUnique({
    where: { draftToken },
    include: {
      tracks: { orderBy: [{ side: "asc" }, { position: "asc" }] },
    },
  });

  if (!tape || tape.status === "deleted") return null;
  return tape;
}

// ─── getTapeByPublicId (for recipient view) ──────────────────────────────────

export async function getTapeByPublicId(publicId: string): Promise<PublicTape | null> {
  'use server';
  
  console.log(`[getTapeByPublicId] >>> START - publicId: ${publicId}`);
  
  try {
    console.log(`[getTapeByPublicId] Querying database...`);
    
    const tape = await prisma.tape.findUnique({
      where: { publicId },
      include: {
        tracks: {
          orderBy: [{ side: "asc" }, { position: "asc" }],
        },
      },
    });

    console.log(`[getTapeByPublicId] Query result:`, tape ? `Found tape ${tape.id}` : 'No tape found');

    if (!tape) {
      console.log(`[getTapeByPublicId] >>> RETURN NULL - No tape found`);
      return null;
    }

    console.log(`[getTapeByPublicId] Tape details - status: ${tape.status}, tracks: ${tape.tracks.length}`);
    
    if (tape.tracks.length > 0) {
      console.log(`[getTapeByPublicId] First track:`, {
        id: tape.tracks[0].id,
        title: tape.tracks[0].title,
        providerTrackId: tape.tracks[0].providerTrackId,
        side: tape.tracks[0].side
      });
    }

    if (tape.status !== "published") {
      console.log(`[getTapeByPublicId] >>> RETURN NULL - Status is "${tape.status}", not "published"`);
      return null;
    }

    console.log(`[getTapeByPublicId] >>> RETURN TAPE - Published tape with ${tape.tracks.length} tracks`);
    return tape;
  } catch (error) {
    console.error(`[getTapeByPublicId] >>> ERROR:`, error);
    throw error;
  }
}

// ─── recordShare ────────────────────────────────────────────────────────────

export async function recordShare(tapeId: string, platform: string) {
  // Fire-and-forget — don't block the share action
  await prisma.shareEvent.create({
    data: {
      tapeId,
      platform,
    },
  }).catch(err => {
    console.warn("Failed to record share event:", err);
  });

  // Track in PostHog
  const { trackEvent, EVENTS } = await import("@/app/lib/posthog");
  trackEvent(tapeId, EVENTS.TAPE_SHARED, {
    platform,
  }).catch(err => console.warn("PostHog tracking error:", err));

  return { ok: true };
}
// ─── getPublicTapes (for homepage shelf) ────────────────────────────────────

export async function getPublicTapes(limit = 18): Promise<PublicShelfTape[]> {
  // Try public-visibility tapes first; fall back gracefully if field doesn't match
  const tapes = await prisma.tape.findMany({
    where: {
      status: "published",
      // Only show tapes explicitly set to "public" — unlisted tapes stay private
      visibility: "public",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      publicId: true,
      title: true,
      senderName: true,
      recipientName: true,
      style: true,
    },
  }).catch(() => [] as PublicShelfTape[]);
  return tapes;
}

// ─── recordView ──────────────────────────────────────────────────────────────

export async function recordView(tapeId: string, sessionId: string) {
  // Fire-and-forget — don't block the page render
  await prisma.tapeView.create({ data: { tapeId, sessionId } }).catch(() => {});

  // Track in PostHog
  const { trackEvent, EVENTS } = await import("@/app/lib/posthog");
  trackEvent(sessionId, EVENTS.TAPE_VIEWED, {
    tapeId,
  }).catch(err => console.warn("PostHog tracking error:", err));
}

// ─── recordContentReport ──────────────────────────────────────────────────────

export async function recordContentReport(
  tapeId: string,
  sessionId: string,
  reason: "inappropriate" | "spam" | "copyright" | "harassment" | "other",
  details?: string
) {
  try {
    const report = await prisma.contentReport.create({
      data: {
        tapeId,
        reporterSessionId: sessionId,
        reason,
        details: details?.slice(0, 200) || null,
        status: "pending",
      },
    });

    // If this is the 3rd+ report, auto-flag tape for review
    const reportCount = await prisma.contentReport.count({
      where: { tapeId, status: { in: ["pending", "reviewed"] } },
    });

    if (reportCount >= 3) {
      await prisma.tape.update({
        where: { id: tapeId },
        data: { flaggedForReview: true },
      });
    }

    return { ok: true, reportId: report.id };
  } catch (error) {
    console.error("Error recording report:", error);
    return { error: "Failed to submit report" };
  }
}

// ─── Media Asset Management ─────────────────────────────────────────────────

/**
 * Get MediaAsset status for a given media asset ID
 * Used for client-side polling during processing
 */
export async function getMediaAssetStatus(mediaAssetId: string) {
  try {
    const { getMediaAssetStatus: getStatus } = await import("@/app/lib/media-asset");
    const status = await getStatus(mediaAssetId);
    return status;
  } catch (error) {
    console.error("[getMediaAssetStatus] Error:", error);
    return null;
  }
}

/**
 * Retry a failed MediaAsset processing job
 * Only works if status is FAILED and attemptCount < MAX_RETRIES
 */
export async function retryMediaAsset(mediaAssetId: string) {
  try {
    const { prisma } = await import("@/app/lib/prisma");
    const {
      shouldRetry,
      calculateBackoffDelay,
      updateMediaAssetStatus,
    } = await import("@/app/lib/media-asset");

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: {
        id: true,
        status: true,
        attemptCount: true,
        providerTrackId: true,
      },
    });

    if (!asset) {
      return { error: "Media asset not found." };
    }

    const maxRetries = parseInt(process.env.MAX_RETRIES || "3", 10);

    if (!shouldRetry(asset.status as any, asset.attemptCount, maxRetries)) {
      return {
        error: `Cannot retry: status is ${asset.status}. Max retries (${maxRetries}) may have been exceeded.`,
      };
    }

    // Calculate next attempt time with exponential backoff
    const baseDelayMs = (parseInt(process.env.RETRY_BACKOFF_BASE_MINUTES || "1", 10)) * 60 * 1000;
    const nextAttemptMs = calculateBackoffDelay(asset.attemptCount + 1, baseDelayMs);
    const nextAttemptAt = new Date(Date.now() + nextAttemptMs);

    // Update status to PENDING and schedule retry
    await prisma.mediaAsset.update({
      where: { id: mediaAssetId },
      data: {
        status: "PENDING",
        nextAttemptAt,
        attemptCount: asset.attemptCount + 1,
      },
    });

    console.log("[retryMediaAsset] Scheduled retry:", {
      mediaAssetId,
      nextAttemptAt,
      attemptCount: asset.attemptCount + 1,
    });

    return { ok: true, nextAttemptAt };
  } catch (error) {
    console.error("[retryMediaAsset] Error:", error);
    return { error: "Failed to schedule retry." };
  }
}

/**
 * Check media asset status and get user-friendly error message if failed
 */
export async function getMediaAssetError(mediaAssetId: string) {
  try {
    const { prisma } = await import("@/app/lib/prisma");
    const { getUserFriendlyError } = await import("@/app/lib/media-asset");

    const asset = await prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: {
        status: true,
        error: true,
      },
    });

    if (!asset) return null;

    return getUserFriendlyError(asset as any);
  } catch (error) {
    console.error("[getMediaAssetError] Error:", error);
    return "Unable to process this track.";
  }
}
