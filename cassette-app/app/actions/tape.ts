"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { generatePublicId, generateDraftToken, DRAFT_COOKIE } from "@/app/lib/tokens";
import type { TapeStyle, TapeRelationship, TrackInput } from "@/app/lib/types";
import { checkContentForSpam, checkForDuplicates } from "@/app/lib/safety";

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

async function getVerifiedTape(draftId: string) {
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
  return tape as any;
}

// ─── createDraft ────────────────────────────────────────────────────────────

export async function createDraft(formData: FormData) {
  const senderName    = (formData.get("senderName")    as string | null)?.trim() ?? "";
  const relationship  = (formData.get("relationship")  as string | null) ?? "other";
  const style         = (formData.get("style")         as TapeStyle | null) ?? "classic";
  const recipientName = (formData.get("recipientName") as string | null)?.trim() || null;
  const title         = (formData.get("title")         as string | null)?.trim() || null;
  const dedication    = (formData.get("dedication")    as string | null)?.trim().slice(0, 500) || null;
  const createdFromTapeId = (formData.get("fromTapeId") as string | null) || null;

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

  // Enforce 12-per-side limit
  const sideCount = await prisma.tapeTrack.count({
    where: { tapeId: draftId, side: track.side },
  });
  if (sideCount >= 12) {
    return { error: `Side ${track.side} is full (12 tracks max).` };
  }

  const created = await prisma.tapeTrack.create({
    data: {
      tapeId:          draftId,
      side:            track.side,
      position:        track.position,
      title:           track.title,
      artist:          track.artist ?? null,
      thumbnailUrl:    track.thumbnailUrl ?? null,
      provider:        track.provider ?? "youtube",
      providerTrackId: track.providerTrackId,
      personalNote:    track.personalNote?.slice(0, 280) ?? null,
      durationSec:     track.durationSec ?? null,
    },
  });

  // Track the event
  const { trackEvent, EVENTS } = await import("@/app/lib/posthog");
  trackEvent(tape.senderName, EVENTS.TRACK_ADDED, {
    side: track.side,
    title: track.title,
  }).catch(err => console.warn("PostHog tracking error:", err));

  return { ok: true, track: created };
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

    const created = await prisma.tapeTrack.create({
      data: {
        tapeId:          draftId,
        side,
        position,
        title:           item.title,
        artist:          item.channelTitle ?? null,
        thumbnailUrl:    item.thumbnail ?? null,
        provider:        "youtube",
        providerTrackId: item.videoId,
        durationSec:     item.durationSec ?? null,
      },
    });

    createdTracks.push(created);
  }

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

export async function getTapeByDraftToken(draftToken: string) {
  const tape = await prisma.tape.findUnique({
    where: { draftToken },
    select: {
      id: true,
      publicId: true,
      draftToken: true,
      title: true,
      dedication: true,
      senderName: true,
      recipientName: true,
      relationship: true,
      style: true,
      visibility: true,
      memoryDate: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      tracks: { orderBy: [{ side: "asc" }, { position: "asc" }] },
    },
  });

  if (!tape || tape.status === "deleted") return null;
  return tape as any;
}

// ─── getTapeByPublicId (for recipient view) ──────────────────────────────────

export async function getTapeByPublicId(publicId: string) {
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

export async function getPublicTapes(limit = 18) {
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
  }).catch(() => [] as never[]);
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
