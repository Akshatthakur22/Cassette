/**
 * Admin metrics queries
 * Pulls from database and analytics
 */

import { prisma } from "@/app/lib/prisma";

export interface TapeMetrics {
  tapeId: string;
  publicId: string;
  title: string;
  views: number;
  shares: number;
  reports: number;
  likes: number;
  createdAt: Date;
}

export interface DashboardStats {
  totalTapes: number;
  publicTapes: number;
  privateTapes: number;
  totalViews: number;
  totalShares: number;
  totalReports: number;
  reportedTapes: number;
  avgViewsPerTape: number;
  avgSharesPerTape: number;
}

export interface ShareMetrics {
  platform: string;
  count: number;
  percentage: number;
}

/**
 * Get overall dashboard stats
 */
export async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const [totalTapes, publicTapes, privateTapes] = await Promise.all([
      prisma.tape.count(),
      prisma.tape.count({ where: { visibility: "public" } }),
      prisma.tape.count({ where: { visibility: "private" } }),
    ]);

    const tapeViews = await prisma.tapeView.count();
    const shareCounts = await prisma.shareEvent.count();

    const avgViews = totalTapes > 0 ? tapeViews / totalTapes : 0;
    const avgShares = totalTapes > 0 ? shareCounts / totalTapes : 0;

    return {
      totalTapes,
      publicTapes,
      privateTapes,
      totalViews: tapeViews,
      totalShares: shareCounts,
      totalReports: 0, // contentReport removed from schema
      reportedTapes: 0, // flaggedForReview removed from schema
      avgViewsPerTape: Math.round(avgViews),
      avgSharesPerTape: Math.round(avgShares),
    };
  } catch (error) {
    console.error("Failed to get dashboard stats:", error);
    return null;
  }
}

/**
 * Get top tapes by views
 */
export async function getTopTapesByViews(limit = 10): Promise<TapeMetrics[]> {
  try {
    const tapes = await prisma.tape.findMany({
      where: { visibility: "public" },
      select: {
        id: true,
        publicId: true,
        title: true,
        createdAt: true,
      },
      take: limit,
    });

    const metricsPromises = tapes.map(async (tape) => {
      const [shares, views] = await Promise.all([
        prisma.shareEvent.count({ where: { tapeId: tape.id } }),
        prisma.tapeView.count({ where: { tapeId: tape.id } }),
      ]);

      return {
        tapeId: tape.id,
        publicId: tape.publicId,
        title: tape.title || "Untitled",
        views,
        shares,
        reports: 0, // contentReport removed from schema
        likes: 0,
        createdAt: tape.createdAt,
      };
    });

    return Promise.all(metricsPromises);
  } catch (error) {
    console.error("Failed to get top tapes:", error);
    return [];
  }
}

/**
 * Get reported tapes needing review
 * NOTE: flaggedForReview and contentReport removed from schema - functionality disabled
 */
export async function getReportedTapes(limit = 20) {
  // Functionality disabled - flaggedForReview field removed from schema
  return [];
}

/**
 * Get share distribution by platform
 */
export async function getShareMetrics(): Promise<ShareMetrics[]> {
  try {
    const shares = await prisma.shareEvent.groupBy({
      by: ["platform"],
      _count: { id: true },
    });

    const total = shares.reduce((sum, s) => sum + s._count.id, 0);

    return shares
      .map((s) => ({
        platform: s.platform,
        count: s._count.id,
        percentage: Math.round((s._count.id / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error("Failed to get share metrics:", error);
    return [];
  }
}

/**
 * Get views over time (last 7 days)
 */
export async function getViewsTimeSeries() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const views = await prisma.tapeView.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: { createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "asc" },
    });

    return views.map((v) => ({
      date: v.createdAt,
      views: v._count.id,
    }));
  } catch (error) {
    console.error("Failed to get views time series:", error);
    return [];
  }
}

/**
 * Approve/dismiss reported tape
 * NOTE: flaggedForReview and contentReport removed from schema - functionality disabled
 */
export async function reviewReportedTape(
  tapeId: string,
  action: "approve" | "dismiss"
) {
  // Functionality disabled - flaggedForReview field removed from schema
  return null;
}
