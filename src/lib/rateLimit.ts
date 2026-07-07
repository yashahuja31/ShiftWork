/**
 * Minimal fixed-window rate limiter.
 *
 * IMPORTANT (see SECURITY.md): this in-memory implementation only limits
 * requests within a single server process. It is fine for local dev and for
 * single-instance deployments (e.g. one Railway/Render service), but if you
 * scale to multiple instances behind a load balancer, each instance gets its
 * own counter and a determined attacker can multiply their effective quota
 * by the instance count. For real production scale, swap this for a shared
 * store such as Upstash Redis (`@upstash/ratelimit`) so all instances share
 * one counter. The function signature below is written so that swap only
 * touches this one file.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key        Unique identifier for the caller (use the authenticated
 *                   user id, NEVER a client-suppliable value like an IP
 *                   header alone, which can be spoofed).
 * @param limit      Max requests allowed per window.
 * @param windowMs   Window length in milliseconds.
 */
export function rateLimit(key: string, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

// Prevent unbounded memory growth from one-off callers (e.g. bots hammering
// with random keys). Sweeps expired buckets every 5 minutes.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 5 * 60_000).unref?.();
