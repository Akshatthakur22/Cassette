"use client";

import { useEffect } from "react";
import { usePerformanceMonitoring } from "@/app/lib/performance-monitoring";

/**
 * PerformanceMonitor Component
 * Attaches performance tracking to the page
 * Should be included once in root layout
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Initialize performance monitoring
    usePerformanceMonitoring();

    // Log performance summary on mount
    if (process.env.NODE_ENV !== "production") {
      const logPerformance = () => {
        const perfData = window.performance.getEntriesByType("navigation")[0];
        if (perfData) {
          const timing = perfData as any;
          console.log("[Performance]", {
            domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
            loadComplete: timing.loadEventEnd - timing.loadEventStart,
            domInteractive: timing.domInteractive - timing.fetchStart,
          });
        }
      };

      // Run after page fully loads
      if (document.readyState === "complete") {
        logPerformance();
      } else {
        window.addEventListener("load", logPerformance);
        return () => window.removeEventListener("load", logPerformance);
      }
    }
  }, []);

  return null; // This component doesn't render anything
}
