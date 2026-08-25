"use client";

import { motion } from "framer-motion";
import { MediaAssetStatus } from "@/app/lib/types";
import { useMediaAssetRetry } from "@/app/hooks/useMediaAssetRetry";
import { useState } from "react";

interface MediaAssetStatusBadgeProps {
  status: MediaAssetStatus;
  mediaAssetId?: string;
  progress?: number;
  error?: string;
}

export function MediaAssetStatusBadge({
  status,
  mediaAssetId,
  progress = 0,
  error,
}: MediaAssetStatusBadgeProps) {
  const { retry, retrying } = mediaAssetId ? useMediaAssetRetry({ mediaAssetId }) : { retry: null, retrying: false };
  const [showRetryError, setShowRetryError] = useState(false);

  const handleRetry = async () => {
    try {
      await retry?.();
      setShowRetryError(false);
    } catch (err) {
      setShowRetryError(true);
    }
  };

  const statusConfig = {
    PENDING: { color: "#94A3B8", icon: "⏳", label: "Pending" },
    VALIDATING: { color: "#60A5FA", icon: "🔍", label: "Validating" },
    DOWNLOADING: { color: "#3B82F6", icon: "⬇️", label: "Downloading" },
    CONVERTING: { color: "#8B5CF6", icon: "🎵", label: "Converting" },
    UPLOADING: { color: "#EC4899", icon: "⬆️", label: "Uploading" },
    READY: { color: "#10B981", icon: "✓", label: "Ready" },
    FAILED: { color: "#EF4444", icon: "✕", label: "Failed" },
    EXPIRED: { color: "#6B7280", icon: "⏱️", label: "Expired" },
  };

  const config = statusConfig[status];

  if (status === "READY") {
    return (
      <span
        className="px-2 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1"
        style={{
          background: `${config.color}20`,
          color: config.color,
          border: `1px solid ${config.color}40`,
        }}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1"
            style={{
              background: `${config.color}20`,
              color: config.color,
              border: `1px solid ${config.color}40`,
            }}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
          {retry && (
            <div onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-2 py-1 rounded text-xs font-mono font-semibold transition-colors"
                style={{
                  background: retrying ? "#E5E7EB" : "#DBEAFE",
                  color: retrying ? "#6B7280" : "#0369A1",
                  border: `1px solid ${retrying ? "#D1D5DB" : "#7DD3FC"}`,
                  cursor: retrying ? "not-allowed" : "pointer",
                }}
              >
                {retrying ? "Retrying..." : "Retry"}
              </button>
            </div>
          )}
        </div>
        {error && (
          <span className="text-[10px] text-red-600 font-mono">
            {error}
          </span>
        )}
        {showRetryError && (
          <span className="text-[10px] text-orange-600 font-mono">
            Retry scheduled. Check back in a moment.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="px-2 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1"
        style={{
          background: `${config.color}20`,
          color: config.color,
          border: `1px solid ${config.color}40`,
        }}
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {config.icon}
        </motion.span>
        <span>{config.label}</span>
      </span>

      {progress > 0 && progress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
          <motion.div
            className="h-full"
            style={{ background: config.color }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {progress > 0 && (
        <span className="text-[9px] text-gray-500 font-mono">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}
