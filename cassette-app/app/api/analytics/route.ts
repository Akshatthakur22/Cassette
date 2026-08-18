import { NextRequest, NextResponse } from "next/server";
import { trackEvent } from "@/app/lib/posthog";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json({ error: "event required" }, { status: 400 });
    }

    // Track the event and flush immediately before returning response
    const distinctId = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "anonymous";
    await trackEvent(distinctId, event, properties, true);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Analytics failed" }, { status: 500 });
  }
}
