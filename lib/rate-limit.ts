/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * This is sufficient for a single Node.js process but will NOT share state
 * across serverless function instances on Vercel. For real production
 * traffic, swap this implementation for `@upstash/ratelimit` backed by
 * Upstash Redis (a few lines — see docs/DEPLOYMENT.md) without changing
 * the call sites below.
 */

const hits = new Map<string, number[]>();

export function isRateLimited(key: string, { windowMs, max }: { windowMs: number; max: number }): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return false;
}
