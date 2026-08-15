/**
 * Feature flags and A/B testing framework
 */

export type ExperimentVariant = "control" | "treatment" | "variant_a" | "variant_b";

export interface Experiment {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  variants: {
    control: number;
    treatment?: number;
    variant_a?: number;
    variant_b?: number;
  };
  createdAt: Date;
  endsAt?: Date;
}

export interface ExperimentAssignment {
  experimentId: string;
  userId: string;
  variant: ExperimentVariant;
  assignedAt: Date;
}

// Active experiments configuration
const EXPERIMENTS: Record<string, Experiment> = {
  new_share_button: {
    id: "new_share_button",
    name: "New Share Button Design",
    description: "Test new share button UI vs current",
    enabled: true,
    rolloutPercentage: 50,
    variants: { control: 50, treatment: 50 },
    createdAt: new Date("2026-08-01"),
    endsAt: new Date("2026-09-01"),
  },
  improved_shelf_ui: {
    id: "improved_shelf_ui",
    name: "Improved Shelf Discovery",
    description: "Test new shelf layout",
    enabled: true,
    rolloutPercentage: 30,
    variants: { control: 70, treatment: 30 },
    createdAt: new Date("2026-08-10"),
  },
  voice_message_beta: {
    id: "voice_message_beta",
    name: "Voice Messages Beta",
    description: "Enable voice message recording",
    enabled: true,
    rolloutPercentage: 100,
    variants: { control: 0, treatment: 100 },
    createdAt: new Date("2026-08-15"),
  },
};

// Feature flags (always on/off, no variants)
const FEATURE_FLAGS: Record<string, boolean> = {
  qr_code_share: true,
  admin_dashboard: true,
  playlist_sync: false,
  dark_mode: false,
  email_notifications: true,
};

/**
 * Get hash for consistent variant assignment
 */
function hashUserId(userId: string, experimentId: string): number {
  const str = `${userId}:${experimentId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 100;
}

/**
 * Assign user to experiment variant (deterministic)
 */
export function getExperimentVariant(
  userId: string,
  experimentId: string
): ExperimentVariant | null {
  const experiment = EXPERIMENTS[experimentId];
  if (!experiment || !experiment.enabled) return null;

  // Check if user is in rollout percentage
  const hash = hashUserId(userId, experimentId);
  if (hash > experiment.rolloutPercentage) return null;

  // Assign to variant based on hash
  const variantHash = hash % 100;
  let cumulative = 0;

  for (const [variant, percentage] of Object.entries(experiment.variants)) {
    cumulative += percentage;
    if (variantHash < cumulative) {
      return variant as ExperimentVariant;
    }
  }

  return "control";
}

/**
 * Check if feature flag is enabled
 */
export function isFeatureFlagEnabled(flagName: string): boolean {
  return FEATURE_FLAGS[flagName] ?? false;
}

/**
 * Get all active experiments
 */
export function getActiveExperiments(): Experiment[] {
  return Object.values(EXPERIMENTS).filter((exp) => exp.enabled);
}

/**
 * Get experiment by ID
 */
export function getExperiment(id: string): Experiment | null {
  return EXPERIMENTS[id] ?? null;
}

/**
 * Track experiment event (for analytics)
 */
export interface ExperimentEvent {
  experimentId: string;
  userId: string;
  variant: ExperimentVariant;
  eventType: "viewed" | "clicked" | "converted";
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Store experiment events (to be sent to analytics)
 */
const experimentEvents: ExperimentEvent[] = [];

export function trackExperimentEvent(event: Omit<ExperimentEvent, "timestamp">) {
  experimentEvents.push({ ...event, timestamp: new Date() });
}

export function getExperimentEvents(): ExperimentEvent[] {
  return experimentEvents;
}

export function clearExperimentEvents() {
  experimentEvents.length = 0;
}
