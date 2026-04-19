/**
 * In-memory rate-limit — sliding window.
 *
 * Two limits per IP:
 *   - hourly: 5 requests / 60 min
 *   - daily:  50 requests / 24 h
 *
 * On a single-instance Node server, this is enough. When you scale horizontally,
 * swap to Redis with the same `check` signature.
 */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

interface Bucket {
  hits: number[]; // timestamps of hits (unix ms)
}

declare global {
  // eslint-disable-next-line no-var
  var __saRateBuckets: Map<string, Bucket> | undefined;
  // eslint-disable-next-line no-var
  var __saRatePurge: NodeJS.Timeout | undefined;
}

function getBuckets(): Map<string, Bucket> {
  if (!globalThis.__saRateBuckets) {
    globalThis.__saRateBuckets = new Map();
  }
  return globalThis.__saRateBuckets;
}

function startPurgeTimer() {
  if (globalThis.__saRatePurge) return;
  const t = setInterval(() => {
    const cutoff = Date.now() - DAY_MS;
    const buckets = getBuckets();
    for (const [ip, bucket] of buckets) {
      bucket.hits = bucket.hits.filter((ts) => ts > cutoff);
      if (bucket.hits.length === 0) buckets.delete(ip);
    }
  }, 5 * 60 * 1000);
  if (typeof t.unref === 'function') t.unref();
  globalThis.__saRatePurge = t;
}

export const RATE_LIMIT = {
  hourly: 5,
  daily: 50,
};

export interface RateLimitResult {
  allowed: boolean;
  /** seconds until next slot frees */
  retryAfterSec: number;
  hourlyRemaining: number;
  dailyRemaining: number;
}

/**
 * Check and record a hit for `ip`. Call this exactly once per admitted request.
 */
export function checkRateLimit(ip: string): RateLimitResult {
  startPurgeTimer();
  const now = Date.now();
  const hourCutoff = now - HOUR_MS;
  const dayCutoff = now - DAY_MS;
  const buckets = getBuckets();

  let bucket = buckets.get(ip);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(ip, bucket);
  }

  // evict old
  bucket.hits = bucket.hits.filter((ts) => ts > dayCutoff);

  const hourly = bucket.hits.filter((ts) => ts > hourCutoff).length;
  const daily = bucket.hits.length;

  if (hourly >= RATE_LIMIT.hourly) {
    const oldestInHour = bucket.hits.find((ts) => ts > hourCutoff) ?? now;
    const retryAfter = Math.max(1, Math.ceil((oldestInHour + HOUR_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSec: retryAfter,
      hourlyRemaining: 0,
      dailyRemaining: Math.max(0, RATE_LIMIT.daily - daily),
    };
  }
  if (daily >= RATE_LIMIT.daily) {
    const oldest = bucket.hits[0] ?? now;
    const retryAfter = Math.max(1, Math.ceil((oldest + DAY_MS - now) / 1000));
    return {
      allowed: false,
      retryAfterSec: retryAfter,
      hourlyRemaining: Math.max(0, RATE_LIMIT.hourly - hourly),
      dailyRemaining: 0,
    };
  }

  // admit
  bucket.hits.push(now);
  return {
    allowed: true,
    retryAfterSec: 0,
    hourlyRemaining: RATE_LIMIT.hourly - hourly - 1,
    dailyRemaining: RATE_LIMIT.daily - daily - 1,
  };
}

/**
 * Extract the client IP from a Next.js Request.
 * Trusts `x-forwarded-for` — deploy behind a trusted proxy.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}
