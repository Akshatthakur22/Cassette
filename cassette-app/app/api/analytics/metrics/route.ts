/**
 * Performance metrics collection endpoint
 * Receives Core Web Vitals and performance data from clients
 */

import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/app/lib/posthog";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, rating, url, userAgent, timestamp } = body;

    if (!name || value === undefined) {
      return NextResponse.json(
        { error: "name and value required" },
        { status: 400 }
      );
    }

    // Get client IP for distinct ID
    const clientIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    // Track in PostHog or your analytics service
    await trackEvent(clientIp, `performance_${name}`, {
      metricName: name,
      metricValue: value,
      rating: rating,
      url: url,
      userAgent: userAgent,
      timestamp: timestamp,
    });

    // Log to server (optional)
    if (process.env.NODE_ENV === "production") {
      console.log(`[Metrics] ${name}: ${value.toFixed(2)} (${rating})`);
    }

    return NextResponse.json({
      ok: true,
      metric: {
        name,
        value,
        rating,
      },
    });
  } catch (error) {
    console.error("Metrics API error:", error);
    return NextResponse.json(
      { error: "Metrics collection failed" },
      { status: 500 }
    );
  }
}
