/**
 * Safety, abuse prevention, and spam detection utilities
 */

import { prisma } from "./prisma";

export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
  score: number; // 0-100, higher = more likely spam
}

export interface ContentReport {
  tapeId: string;
  reporterSessionId: string;
  reason: "inappropriate" | "spam" | "copyright" | "harassment" | "other";
  details?: string;
  timestamp: Date;
}

/**
 * Detect potential spam in tape metadata
 * Checks for: excessive links, repeated characters, suspicious patterns
 */
export function checkContentForSpam(
  title?: string | null,
  dedication?: string | null,
  senderName?: string | null
): SpamCheckResult {
  const content = `${title || ""} ${dedication || ""} ${senderName || ""}`.toLowerCase();
  let score = 0;
  let reason: string | undefined;

  // Empty content
  if (!content.trim()) {
    return { isSpam: false, score: 0 };
  }

  // Check for excessive URLs
  const urlCount = (content.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    score += 40;
    reason = "Multiple URLs detected";
  }

  // Check for repeated characters (spam indicator)
  const repeatedChars = content.match(/(.)\1{4,}/g);
  if (repeatedChars) {
    score += 25;
    reason = "Repeated characters pattern";
  }

  // Check for ALL CAPS + short content (screaming)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.7 && content.length < 50) {
    score += 15;
    reason = "Excessive capitals in short content";
  }

  // Check for common spam keywords
  const spamKeywords = [
    "click here",
    "buy now",
    "free money",
    "follow us",
    "subscribe now",
    "bitcoin",
    "crypto",
    "nft",
  ];
  const hasSpamKeyword = spamKeywords.some((keyword) =>
    content.includes(keyword)
  );
  if (hasSpamKeyword) {
    score += 35;
    reason = "Suspicious keywords detected";
  }

  // Check for phone numbers (potential scam)
  const phonePattern = /(?:\+?\d{1,3}[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/;
  if (phonePattern.test(content)) {
    score += 30;
    reason = "Phone number pattern detected";
  }

  // Threshold: 60+ is likely spam
  const isSpam = score >= 60;

  return { isSpam, reason, score };
}

/**
 * Check for duplicate/similar tapes from same creator
 * Prevents spam by same user creating identical tapes repeatedly
 */
export async function checkForDuplicates(
  senderName: string,
  title?: string | null,
  trackIds?: string[]
): Promise<{ isDuplicate: boolean; similarTapeCount: number }> {
  if (!title || title.trim().length < 3) {
    return { isDuplicate: false, similarTapeCount: 0 };
  }

  try {
    // Find tapes with same sender and similar title created in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const similarTapes = await prisma.tape.findMany({
      where: {
        senderName,
        createdAt: { gte: oneDayAgo },
        title: {
          contains: title.substring(0, Math.min(10, title.length)),
          mode: "insensitive",
        },
      },
      select: { id: true, title: true },
    });

    // If exact match exists, likely duplicate
    const exactMatch = similarTapes.some(
      (t) => t.title?.toLowerCase() === title.toLowerCase()
    );

    return {
      isDuplicate: exactMatch || similarTapes.length > 3,
      similarTapeCount: similarTapes.length,
    };
  } catch (error) {
    console.error("Error checking for duplicates:", error);
    return { isDuplicate: false, similarTapeCount: 0 };
  }
}

/**
 * Record a content report
 */
export async function recordContentReport(
  tapeId: string,
  reporterSessionId: string,
  reason: "inappropriate" | "spam" | "copyright" | "harassment" | "other",
  details?: string
): Promise<{ success: boolean; reportId?: string }> {
  try {
    const report = await prisma.contentReport.create({
      data: {
        tapeId,
        reporterSessionId,
        reason,
        details,
        status: "pending",
      },
    });

    // If this is the 3rd report on a tape, auto-flag for review
    const reportCount = await prisma.contentReport.count({
      where: { tapeId, status: "pending" },
    });

    if (reportCount >= 3) {
      await prisma.tape.update({
        where: { id: tapeId },
        data: { flaggedForReview: true },
      });
    }

    return { success: true, reportId: report.id };
  } catch (error) {
    console.error("Error recording report:", error);
    return { success: false };
  }
}

/**
 * Get pending content reports (for moderation queue)
 */
export async function getPendingReports(limit = 50, offset = 0) {
  try {
    const reports = await prisma.contentReport.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
      select: {
        id: true,
        tapeId: true,
        reason: true,
        details: true,
        createdAt: true,
        tape: {
          select: {
            publicId: true,
            title: true,
            senderName: true,
            recipientName: true,
          },
        },
      },
    });

    return reports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

/**
 * Review a report - mark as resolved
 */
export async function resolveReport(
  reportId: string,
  action: "keep" | "delete" | "flag"
): Promise<{ success: boolean }> {
  try {
    const report = await prisma.contentReport.findUnique({
      where: { id: reportId },
      select: { tapeId: true },
    });

    if (!report) {
      return { success: false };
    }

    // Update report status
    await prisma.contentReport.update({
      where: { id: reportId },
      data: { status: action === "delete" ? "removed" : "reviewed" },
    });

    // If deleting, soft-delete the tape
    if (action === "delete") {
      await prisma.tape.update({
        where: { id: report.tapeId },
        data: {
          status: "deleted",
          deletedAt: new Date(),
          flaggedForReview: false,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error resolving report:", error);
    return { success: false };
  }
}

/**
 * Check if user should be rate-limited based on recent activity
 * Prevents rapid-fire tape creation, track additions, etc.
 */
export async function checkUserSuspicion(
  sessionId: string,
  ip: string
): Promise<{ isSuspicious: boolean; score: number }> {
  let suspicionScore = 0;

  try {
    // Check recent tape creation rate from this session/IP
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTapes = await prisma.tape.count({
      where: {
        createdAt: { gte: fiveMinutesAgo },
        // This would need a session/IP tracking field in Tape model
        // For now, just counting
      },
    });

    if (recentTapes > 10) suspicionScore += 40;

    // You could add more checks here in the future:
    // - Multiple reports from same IP
    // - Rapid follow-up tape creation
    // - Unusual track patterns

    return {
      isSuspicious: suspicionScore >= 50,
      score: suspicionScore,
    };
  } catch (error) {
    console.error("Error checking user suspicion:", error);
    return { isSuspicious: false, score: 0 };
  }
}
