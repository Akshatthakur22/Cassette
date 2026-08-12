"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { generatePublicId, generateDraftToken, DRAFT_COOKIE } from "@/app/lib/tokens";
import type { TapeStyle, TapeRelationship, TrackInput } from "@/app/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────

async function getVerifiedTape(draftId: string) {
  const jar = await cookies();
  const token = jar.get(DRAFT_COOKIE)?.value;
  if (!token) return null;

  const tape = await prisma.tape.findUnique({ where: { id: draftId } });
  if (!tape || tape.draftToken !== token) return null;
  if (tape.status === "deleted") return null;
  return tape;
}

// ─── createDraft ────────────────────────────────────────────────────────────

export async function createDraft(formData: FormData) {
  const senderName   = (formData.get("senderName")   as string | null)?.trim() ?? "";
  const relationship = (formData.get("relationship") as string | null) ?? "other";
  const style        = (formData.get("style")        as TapeStyle | null) ?? "classic";
  const recipientName = (formData.get("recipientName") as string | null)?.trim() || null;
  const title         = (formData.get("title")         as string | null)?.trim() || null;
  const dedication    = (formData.get("dedication")    as string | null)?.trim().slice(0, 500) || null;

  if (!senderName) {
    return { error: "Please enter your name." };
  }

  // Rate limiting: max 10 drafts per session per hour
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

  const rateLimitKey = `draft:${sessionId}`;
  const { checkRateLimit } = await import("@/app/lib/rate-limit");
  if (!checkRateLimit(rateLimitKey, 10, 3600000)) {
    return { error: "Too many tapes created. Please try again later." };
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
    },
  });

  // Set the draft-token cookie (httpOnly, 30 day expiry)
  jar.set(DRAFT_COOKIE, draftToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

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

  await prisma.tape.update({
    where: { id: draftId },
    data: { title, recipientName, dedication, style },
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

  await prisma.tapeTrack.deleteMany({ where: { id: trackId, tapeId: draftId } });

  // Re-number remaining tracks on that side
  const side = (await prisma.tapeTrack.findFirst({ where: { tapeId: draftId } }))?.side ?? "A";
  const remaining = await prisma.tapeTrack.findMany({
    where: { tapeId: draftId },
    orderBy: [{ side: "asc" }, { position: "asc" }],
  });
  for (let i = 0; i < remaining.length; i++) {
    await prisma.tapeTrack.update({ where: { id: remaining[i].id }, data: { position: i } });
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

  await Promise.all(
    orderedIds.map((id, idx) =>
      prisma.tapeTrack.updateMany({
        where: { id, tapeId: draftId, side },
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
  });

  return { ...tape, tracks };
}

// ─── getTapeByDraftToken (for creator management) ───────────────────────────

export async function getTapeByDraftToken(draftToken: string) {
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

export async function getTapeByPublicId(publicId: string) {
  try {
    console.log(`[getTapeByPublicId] Fetching tape with publicId: ${publicId}`);
    
    const tape = await prisma.tape.findUnique({
      where: { publicId },
      include: {
        tracks: { orderBy: [{ side: "asc" }, { position: "asc" }] },
      },
    });

    console.log(`[getTapeByPublicId] Query completed. Tape found:`, !!tape);

    if (!tape) {
      console.log(`[getTapeByPublicId] No tape found with publicId: ${publicId}`);
      return null;
    }

    console.log(`[getTapeByPublicId] Tape details:`, {
      id: tape.id,
      status: tape.status,
      trackCount: tape.tracks.length,
      tracks: tape.tracks.map(t => ({ id: t.id, title: t.title, providerTrackId: t.providerTrackId }))
    });

    if (tape.status !== "published") {
      console.log(`[getTapeByPublicId] Tape status is "${tape.status}", not "published" - returning null`);
      return null;
    }

    console.log(`[getTapeByPublicId] Returning published tape with ${tape.tracks.length} tracks`);
    return tape;
  } catch (error) {
    console.error(`[getTapeByPublicId] Database error:`, error);
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
