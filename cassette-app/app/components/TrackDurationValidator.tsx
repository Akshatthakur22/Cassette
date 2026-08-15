"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DURATION_RULES } from "@/app/lib/recording-types";

interface TrackDurationValidatorProps {
  durationSec?: number;
  title?: string;
  showDetails?: boolean;
}

interface ValidationWarning {
  type: "error" | "warning" | "info";
  message: string;
  icon: string;
}

export default function TrackDurationValidator({
  durationSec,
  title,
  showDetails = true,
}: TrackDurationValidatorProps) {
  if (!durationSec || durationSec <= 0) {
    return null;
  }

  const getValidationStatus = (): ValidationWarning | null => {
    if (durationSec < DURATION_RULES.MIN_DURATION_SEC) {
      return {
        type: "error",
        icon: "❌",
        message: `Too short (${durationSec}s). Minimum is ${DURATION_RULES.MIN_DURATION_SEC}s.`,
      };
    }

    if (durationSec > DURATION_RULES.MAX_DURATION_SEC) {
      return {
        type: "error",
        icon: "❌",
        message: `Too long (${formatDuration(durationSec)}). Maximum is ${formatDuration(DURATION_RULES.MAX_DURATION_SEC)}.`,
      };
    }

    if (durationSec < DURATION_RULES.IDEAL_MIN_SEC) {
      return {
        type: "warning",
        icon: "⚠️",
        message: `Short track (${durationSec}s). Ideal minimum is ${DURATION_RULES.IDEAL_MIN_SEC}s.`,
      };
    }

    if (durationSec > DURATION_RULES.IDEAL_MAX_SEC) {
      return {
        type: "warning",
        icon: "⚠️",
        message: `Long track (${formatDuration(durationSec)}). Ideal maximum is ${formatDuration(DURATION_RULES.IDEAL_MAX_SEC)}.`,
      };
    }

    return {
      type: "info",
      icon: "✓",
      message: `Perfect duration (${formatDuration(durationSec)})`,
    };
  };

  const status = getValidationStatus();
  if (!status) return null;

  const bgColor =
    status.type === "error"
      ? "rgba(196, 80, 58, 0.08)"
      : status.type === "warning"
        ? "rgba(255, 184, 0, 0.08)"
        : "rgba(76, 175, 80, 0.08)";

  const borderColor =
    status.type === "error"
      ? "#C4503A"
      : status.type === "warning"
        ? "#FFB800"
        : "#4CAF50";

  const textColor =
    status.type === "error"
      ? "#C4503A"
      : status.type === "warning"
        ? "#FF8C00"
        : "#4CAF50";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={durationSec}
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.95 }}
        className="flex items-start gap-2.5 p-3 rounded-lg border transition-all"
        style={{
          background: bgColor,
          borderColor: borderColor,
        }}
      >
        <span className="text-lg flex-shrink-0 mt-0.5">{status.icon}</span>

        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium"
            style={{ color: textColor }}
          >
            {status.message}
          </div>

          {showDetails && title && (
            <p
              className="text-xs mt-1 truncate"
              style={{ color: "#8E8E93" }}
            >
              Track: {title}
            </p>
          )}

          {status.type === "error" && (
            <p
              className="text-xs mt-1.5 font-medium"
              style={{ color: textColor }}
            >
              ℹ️ This track cannot be added. Please choose a different song.
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

/**
 * Utility to check if track duration is valid for inclusion
 */
export function isTrackDurationValid(durationSec?: number): boolean {
  if (!durationSec || durationSec <= 0) return false;
  return (
    durationSec >= DURATION_RULES.MIN_DURATION_SEC &&
    durationSec <= DURATION_RULES.MAX_DURATION_SEC
  );
}

/**
 * Get all validation warnings for a track
 */
export function getTrackDurationWarnings(durationSec?: number): string[] {
  const warnings: string[] = [];

  if (!durationSec || durationSec <= 0) {
    warnings.push("Duration not available");
    return warnings;
  }

  if (durationSec < DURATION_RULES.MIN_DURATION_SEC) {
    warnings.push(
      `Track too short (${durationSec}s, minimum ${DURATION_RULES.MIN_DURATION_SEC}s)`
    );
  }

  if (durationSec > DURATION_RULES.MAX_DURATION_SEC) {
    warnings.push(
      `Track too long (${formatDuration(durationSec)}, maximum ${formatDuration(DURATION_RULES.MAX_DURATION_SEC)})`
    );
  }

  if (
    durationSec > DURATION_RULES.IDEAL_MIN_SEC &&
    durationSec < DURATION_RULES.IDEAL_MAX_SEC
  ) {
    warnings.push("Ideal duration for best playback experience");
  }

  return warnings;
}
