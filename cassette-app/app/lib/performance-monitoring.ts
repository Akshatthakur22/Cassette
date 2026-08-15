/**
 * Performance Monitoring
 * Tracks Core Web Vitals and sends to analytics
 * Integrates with web-vitals library
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needsImprovement" | "poor";
  delta?: number;
  id: string;
  navigationType?: string;
  entries?: PerformanceEntry[];
}

export interface CoreWebVitals {
  LCP?: number; // Largest Contentful Paint (ms)
  FID?: number; // First Input Delay (ms)
  CLS?: number; // Cumulative Layout Shift (unitless)
  TTFB?: number; // Time to First Byte (ms)
  FCP?: number; // First Contentful Paint (ms)
}

/**
 * Thresholds for rating metrics
 */
export const METRIC_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // unitless
  TTFB: { good: 600, needsImprovement: 1200 }, // ms
  FCP: { good: 1800, needsImprovement: 3000 }, // ms
};

/**
 * Rate a metric based on thresholds
 */
export function rateMetric(
  name: string,
  value: number
): "good" | "needsImprovement" | "poor" {
  const thresholds = METRIC_THRESHOLDS[name as keyof typeof METRIC_THRESHOLDS];
  if (!thresholds) return "poor";

  if (value <= thresholds.good) return "good";
  if (value <= thresholds.needsImprovement) return "needsImprovement";
  return "poor";
}

/**
 * Send metric to analytics
 */
export async function reportMetric(metric: PerformanceMetric) {
  // Only send in production
  if (process.env.NODE_ENV !== "production") {
    console.log("[Perf]", metric.name, metric.value.toFixed(2), metric.rating);
    return;
  }

  try {
    // Send to your analytics endpoint
    const payload = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      timestamp: new Date().toISOString(),
    };

    // Use navigator.sendBeacon for reliability (won't block page unload)
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/analytics/metrics", blob);
    } else {
      // Fallback to fetch
      await fetch("/api/analytics/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch (error) {
    console.error("Failed to report metric:", error);
  }
}

/**
 * Hook to observe Core Web Vitals using PerformanceObserver
 * Call this in useEffect on client side
 */
export function observeWebVitals() {
  // Only run on client
  if (typeof window === "undefined") return;

  const vitals: CoreWebVitals = {};

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      vitals.LCP = lastEntry.renderTime || lastEntry.loadTime;
      reportMetric({
        name: "LCP",
        value: vitals.LCP || 0,
        rating: rateMetric("LCP", vitals.LCP || 0),
        id: "lcp",
      });
    });
    lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
  } catch (e) {
    console.warn("LCP observer not supported");
  }

  // First Input Delay (FID) / Interaction to Next Paint (INP)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fid =
          "processingDuration" in entry
            ? (entry as any).processingDuration
            : 0;
        vitals.FID = fid;
        reportMetric({
          name: "FID",
          value: vitals.FID || 0,
          rating: rateMetric("FID", vitals.FID || 0),
          id: "fid",
        });
      });
    });
    fidObserver.observe({
      entryTypes: ["first-input", "interaction"],
    });
  } catch (e) {
    console.warn("FID observer not supported");
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          const firstSessionEntry = clsValue;
          clsValue += (entry as any).value;
          console.log("CLS update:", clsValue);

          reportMetric({
            name: "CLS",
            value: clsValue,
            rating: rateMetric("CLS", clsValue),
            id: "cls",
          });
        }
      }
    });
    clsObserver.observe({ entryTypes: ["layout-shift"] });

    // Report final CLS value on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => {
        vitals.CLS = clsValue;
      });
    }
  } catch (e) {
    console.warn("CLS observer not supported");
  }

  // First Contentful Paint (FCP)
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        vitals.FCP = entry.startTime;
        reportMetric({
          name: "FCP",
          value: vitals.FCP || 0,
          rating: rateMetric("FCP", vitals.FCP || 0),
          id: "fcp",
        });
      });
    });
    fcpObserver.observe({ entryTypes: ["paint"] });
  } catch (e) {
    console.warn("FCP observer not supported");
  }

  return vitals;
}

/**
 * Get performance summary from Navigation Timing API
 */
export function getPerformanceSummary() {
  if (typeof window === "undefined") return null;

  const nav = window.performance.timing;
  const perf = window.performance;

  return {
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    ttfb: nav.responseStart - nav.requestStart,
    download: nav.responseEnd - nav.responseStart,
    domInteractive: nav.domInteractive - nav.navigationStart,
    domComplete: nav.domComplete - nav.navigationStart,
    loadComplete: nav.loadEventEnd - nav.navigationStart,
    memory:
      (perf as any).memory?.usedJSHeapSize /
      (1024 * 1024) +
      " MB",
  };
}

/**
 * Client-side performance hook to inject into pages
 */
export function usePerformanceMonitoring() {
  if (typeof window === "undefined") return;

  // Observe Core Web Vitals
  const vitals = observeWebVitals();

  // Log on page unload
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      const summary = getPerformanceSummary();
      console.log("[Performance Summary]", summary);
    });
  }

  return vitals;
}
