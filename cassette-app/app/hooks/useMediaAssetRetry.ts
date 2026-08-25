"use client";

import { useState } from "react";

interface UseMediaAssetRetryOptions {
  mediaAssetId: string;
}

export function useMediaAssetRetry({ mediaAssetId }: UseMediaAssetRetryOptions) {
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const retry = async () => {
    if (!mediaAssetId) return;

    setRetrying(true);
    setRetryError(null);

    try {
      const res = await fetch(`/api/media-assets/${mediaAssetId}/retry`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Retry failed");
      }

      const result = await res.json();
      return result;
    } catch (error) {
      const message = String(error);
      setRetryError(message);
      throw error;
    } finally {
      setRetrying(false);
    }
  };

  return { retry, retrying, retryError };
}
