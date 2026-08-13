/**
 * Dual-key in-memory rate limiter.
 *
 * Tracks by both session-cookie key AND IP address so users can't bypass
 * the limit just by clearing cookies. Each entry uses a sliding window
 * (fixed window reset) approach.
 *
 * NOTE: Because Next.js edge/serverless can spin up multiple instances,
 * this in-memory store is per-instance. For multi-instance production use,
 * swap the store for Upstash Redis (see comment at bottom of file).
 * For a single-dyno or single-region deploy this is fine.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Separate maps so IP limits don't bleed into session limits
const sessionStore = new Map<string, RateLimitEntry>();
const ipStore = new Map<string, RateLimitEntry>();

// ─── GC: prune expired entries every 10 min ──────────────────────────────────
let lastGc = Date.now();
function maybeGc() {
  const now = Date.now();
  if (now - lastGc < 10 * 60 * 1000) return;
  lastGc = now;
  for (const [k, v] of sessionStore) if (now > v.resetAt) sessionStore.delete(k);
  for (const [k, v] of ipStore)      if (now > v.resetAt) ipStore.delete(k);
}

function hit(store: Map<string, RateLimitEntry>, key: string, limit: number, windowMs: number): boolean {
  maybeGc();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  entry.count++;
  if (entry.count > limit) return false; // blocked
  return true;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  /** seconds until the window resets (for Retry-After header) */
  retryAfterSec: number;
  /** remaining requests in this window */
  remaining: number;
}

/**
 * Check both session-based and IP-based limits.
 * The stricter of the two wins.
 *
 * @param sessionKey  e.g. `draft:${sessionId}`
 * @param ip          client IP address (can be empty string if unknown)
 * @param limit       max requests allowed per window (default 10)
 * @param windowMs    window size in ms (default 1 hour)
 */
export function checkRateLimit(
  sessionKey: string,
  ip: string,
  limit = 10,
  windowMs = 60 * 60 * 1000, // 1 hour
): RateLimitResult {
  const now = Date.now();

  // --- session check ---
  const sessionAllowed = hit(sessionStore, sessionKey, limit, windowMs);
  const sessionEntry   = sessionStore.get(sessionKey)!;

  // --- IP check (tighter: same limit, same window) ---
  // Skip IP check if IP is unknown/loopback (local dev)
  const skipIp = !ip || ip === "::1" || ip === "127.0.0.1";
  const ipAllowed = skipIp ? true : hit(ipStore, `ip:${ip}`, limit, windowMs);
  const ipEntry   = skipIp ? null : ipStore.get(`ip:${ip}`);

  const allowed = sessionAllowed && ipAllowed;

  // Pick the entry with the soonest reset for Retry-After
  const resetAt = Math.min(
    sessionEntry?.resetAt ?? now + windowMs,
    ipEntry?.resetAt     ?? now + windowMs,
  );
  const retryAfterSec = Math.max(0, Math.ceil((resetAt - now) / 1000));

  // Remaining = minimum of what both windows have left
  const sessionRemaining = sessionEntry ? Math.max(0, limit - sessionEntry.count) : limit;
  const ipRemaining      = ipEntry      ? Math.max(0, limit - ipEntry.count)      : limit;
  const remaining        = Math.min(sessionRemaining, ipRemaining);

  return { allowed, retryAfterSec, remaining };
}

/**
 * Legacy compat shim — returns simple boolean (used in tests / non-action code).
 */
export function checkRateLimitSimple(key: string, limit = 10, windowMs = 60000): boolean {
  return hit(sessionStore, key, limit, windowMs);
}

/**
 * Clear all stores — used in tests only.
 */
export function clearRateLimitStore() {
  sessionStore.clear();
  ipStore.clear();
}

/**
 * Get remaining requests for a key (read-only).
 */
export function getRemainingRequests(key: string, limit = 10, windowMs = 60000): number {
  const now = Date.now();
  const entry = sessionStore.get(key);
  if (!entry || now > entry.resetAt) return limit;
  return Math.max(0, limit - entry.count);
}

/*
 * ── Upstash Redis upgrade path (production multi-instance) ──────────────────
 *
 * Install: npm install @upstash/ratelimit @upstash/redis
 *
 * import { Ratelimit } from "@upstash/ratelimit";
 * import { Redis }     from "@upstash/redis";
 *
 * const ratelimit = new Ratelimit({
 *   redis:     Redis.fromEnv(),
 *   limiter:   Ratelimit.slidingWindow(10, "1 h"),
 *   analytics: true,
 * });
 *
 * export async function checkRateLimitRedis(identifier: string) {
 *   const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
 *   return { allowed: success, retryAfterSec: Math.ceil((reset - Date.now()) / 1000), remaining };
 * }
 */
