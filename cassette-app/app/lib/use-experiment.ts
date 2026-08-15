"use client";

import { useEffect, useState } from "react";
import { getExperimentVariant, isFeatureFlagEnabled, trackExperimentEvent } from "./experiments";

/**
 * Hook to get user's experiment variant
 * Generates a consistent user ID from session/browser
 */
export function useExperiment(experimentId: string) {
  const [variant, setVariant] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Generate/retrieve user ID
    let id = typeof window !== "undefined" ? localStorage.getItem("cassette_user_id") : null;
    if (!id) {
      id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      if (typeof window !== "undefined") {
        localStorage.setItem("cassette_user_id", id);
      }
    }
    setUserId(id);

    // Get variant assignment
    const assignedVariant = getExperimentVariant(id, experimentId);
    setVariant(assignedVariant || "control");

    // Track view event
    trackExperimentEvent({
      experimentId,
      userId: id,
      variant: assignedVariant || "control",
      eventType: "viewed",
    });
  }, [experimentId]);

  return { variant, userId };
}

/**
 * Hook to check feature flag
 */
export function useFeatureFlag(flagName: string) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(isFeatureFlagEnabled(flagName));
  }, [flagName]);

  return enabled;
}

/**
 * Conditionally render based on experiment variant
 */
export function ExperimentRenderer({
  experimentId,
  control,
  treatment,
}: {
  experimentId: string;
  control: React.ReactNode;
  treatment: React.ReactNode;
}) {
  const { variant } = useExperiment(experimentId);

  if (variant === "treatment") return treatment;
  return control;
}
