/**
 * Simple in-memory rate limiter.
 * Tracks requests by key and enforces a limit over a time window.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Check rate limit for a given key.
 * Returns true if request is allowed, false if rate limited.
 */
export function checkRateLimit(
  key: string,
  limit: number = 10,
  windowMs: number = 60000 // 1 minute default
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // Create new entry or reset expired one
    store.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return true;
  }

  // Increment count
  entry.count++;

  if (entry.count > limit) {
    return false; // Rate limited
  }

  return true;
}

/**
 * Get remaining requests for a key.
 */
export function getRemainingRequests(
  key: string,
  limit: number = 10,
  windowMs: number = 60000
): number {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    return limit;
  }

  return Math.max(0, limit - entry.count);
}

/**
 * Clear the rate limit store (for testing).
 */
export function clearRateLimitStore() {
  store.clear();
}
