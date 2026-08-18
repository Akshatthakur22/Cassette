/**
 * Dynamic XML sitemap for SEO
 * Lists all public tapes and main routes
 */

import { MetadataRoute } from "next";
import { prisma } from "@/app/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const domain = process.env.NEXT_PUBLIC_DOMAIN || "https://cassette-share.vercel.app";

  try {
    // Fetch all public tapes
    const publicTapes = await prisma.tape.findMany({
      where: {
        status: "published",
        visibility: "public",
        deletedAt: null,
      },
      select: {
        publicId: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 50000, // Max sitemap entries
    });

    // Map tapes to sitemap entries
    const tapeEntries: MetadataRoute.Sitemap = publicTapes.map((tape) => ({
      url: `${domain}/t/${tape.publicId}`,
      lastModified: tape.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    // Add main pages
    const mainPages: MetadataRoute.Sitemap = [
      {
        url: `${domain}/`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
      },
      {
        url: `${domain}/shelf`,
        lastModified: new Date(),
        changeFrequency: "hourly" as const,
        priority: 0.9,
      },
      {
        url: `${domain}/create`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      },
      {
        url: `${domain}/developer`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      },
      {
        url: `${domain}/privacy`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      },
      {
        url: `${domain}/terms`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.5,
      },
    ];

    return [...mainPages, ...tapeEntries];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    
    // Return minimal sitemap on error
    return [
      {
        url: `${domain}/`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
      },
      {
        url: `${domain}/shelf`,
        lastModified: new Date(),
        changeFrequency: "hourly" as const,
        priority: 0.9,
      },
    ];
  }
}
