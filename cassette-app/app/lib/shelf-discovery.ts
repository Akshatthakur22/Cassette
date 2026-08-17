/**
 * Shelf discovery utilities for browsing and searching public tapes
 */

import { prisma } from "./prisma";

export interface PublicTapeFilter {
  search?: string; // Search by title, sender, recipient
  style?: string; // Filter by tape style (classic, y2k, love, road_trip)
  relationship?: string; // Filter by relationship type
  sortBy?: "recent" | "popular" | "trending"; // Sort order
  limit?: number;
  offset?: number;
}

export interface DiscoveryTape {
  publicId: string;
  title: string;
  senderName: string;
  recipientName?: string | null;
  style: string;
  relationship?: string | null;
  dedication?: string | null;
  viewCount: number;
  shareCount: number;
  trackCount: number;
  createdAt: Date;
}

/**
 * Search and filter public tapes for discovery shelf
 */
export async function searchPublicTapes(
  filters: PublicTapeFilter = {}
): Promise<DiscoveryTape[]> {
  const {
    search = "",
    style,
    relationship,
    sortBy = "recent",
    limit = 50,
    offset = 0,
  } = filters;

  // Build WHERE clause
  const where: any = {
    status: "published",
    visibility: "public",
    deletedAt: null,
  };

  // Search filter — full-text search on title, senderName, recipientName
  if (search.trim()) {
    const searchTerm = search.toLowerCase().trim();
    where.OR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { senderName: { contains: searchTerm, mode: "insensitive" } },
      { recipientName: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Style filter
  if (style) {
    where.style = style;
  }

  // Relationship filter
  if (relationship) {
    where.relationship = relationship;
  }

  // Build ORDER BY clause
  let orderBy: any = { createdAt: "desc" };

  if (sortBy === "popular") {
    // Sort by view count (requires aggregation or denormalization)
    orderBy = { views: { _count: "desc" } };
  } else if (sortBy === "trending") {
    // Trending = recent views + shares (requires more complex logic)
    orderBy = { updatedAt: "desc" };
  }

  try {
    const tapes = await prisma.tape.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      select: {
        publicId: true,
        title: true,
        senderName: true,
        recipientName: true,
        style: true,
        relationship: true,
        dedication: true,
        createdAt: true,
        _count: {
          select: {
            views: true,
            shareEvents: true,
            tracks: true,
          },
        },
      },
    });

    return tapes.map((tape) => ({
      publicId: tape.publicId,
      title: tape.title || "Untitled Tape",
      senderName: tape.senderName,
      recipientName: tape.recipientName,
      style: tape.style || "classic",
      relationship: tape.relationship,
      dedication: tape.dedication,
      viewCount: tape._count.views,
      shareCount: tape._count.shareEvents,
      trackCount: tape._count.tracks,
      createdAt: tape.createdAt,
    }));
  } catch (error) {
    console.error("Error searching public tapes:", error);
    return [];
  }
}

/**
 * Get featured/trending tapes (for homepage or featured section)
 */
export async function getFeaturedTapes(limit = 6): Promise<DiscoveryTape[]> {
  try {
    const tapes = await prisma.tape.findMany({
      where: {
        status: "published",
        visibility: "public",
        deletedAt: null,
      },
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: limit,
      select: {
        publicId: true,
        title: true,
        senderName: true,
        recipientName: true,
        style: true,
        relationship: true,
        dedication: true,
        createdAt: true,
        _count: {
          select: {
            views: true,
            shareEvents: true,
            tracks: true,
          },
        },
      },
    });

    return tapes.map((tape) => ({
      publicId: tape.publicId,
      title: tape.title || "Untitled Tape",
      senderName: tape.senderName,
      recipientName: tape.recipientName,
      style: tape.style || "classic",
      relationship: tape.relationship,
      dedication: tape.dedication,
      viewCount: tape._count.views,
      shareCount: tape._count.shareEvents,
      trackCount: tape._count.tracks,
      createdAt: tape.createdAt,
    }));
  } catch (error) {
    console.error("Error fetching featured tapes:", error);
    return [];
  }
}

/**
 * Get tape styles available in public shelf
 */
export async function getAvailableStyles(): Promise<string[]> {
  try {
    const styles = await prisma.tape.findMany({
      where: {
        status: "published",
        visibility: "public",
        deletedAt: null,
      },
      select: { style: true },
      distinct: ["style"],
    });
    return styles.map((s) => s.style || "classic").filter(Boolean);
  } catch (error) {
    console.error("Error fetching available styles:", error);
    return ["classic", "y2k", "love", "road_trip"];
  }
}

/**
 * Get relationships available in public shelf
 */
export async function getAvailableRelationships(): Promise<string[]> {
  try {
    const relationships = await prisma.tape.findMany({
      where: {
        status: "published",
        visibility: "public",
        deletedAt: null,
      },
      select: { relationship: true },
      distinct: ["relationship"],
    });
    return relationships
      .map((r) => r.relationship || "other")
      .filter(Boolean);
  } catch (error) {
    console.error("Error fetching available relationships:", error);
    return ["partner", "best_friend", "family", "memory", "self", "other"];
  }
}

/**
 * Get total count of public tapes
 */
export async function getPublicTapeCount(): Promise<number> {
  try {
    return await prisma.tape.count({
      where: {
        status: "published",
        visibility: "public",
        deletedAt: null,
      },
    });
  } catch (error) {
    console.error("Error counting public tapes:", error);
    return 0;
  }
}
