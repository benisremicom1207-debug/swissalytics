/**
 * Unified PageSpeed Insights client (P7.5).
 *
 * Before P7.5, Lighthouse (`/api/geo-analyze`) and CWV
 * (`/api/analyze/cwv`) each issued their own PageSpeed Insights API
 * call for the same URL — two billable Google API calls per user
 * analysis, plus the latency of two round trips.
 *
 * This module:
 *   - Wraps a single PageSpeed call that requests ALL 4 categories
 *     (performance + accessibility + best-practices + seo) in one
 *     shot, so both consumers can read what they need from one
 *     response.
 *   - Caches results in-memory by `${url}::${strategy}` for 5 min,
 *     so back-to-back calls within a user analysis (or quick re-runs
 *     while the user explores) hit cache instead of the network.
 *   - Falls back gracefully when no API key is set (returns null;
 *     callers can decide to estimate or skip).
 *
 * The cache is module-level + globalThis-keyed so it survives module
 * reloads in dev (same pattern as the rate-limit bucket).
 */

const CACHE_TTL_MS = 5 * 60 * 1000;
const PAGESPEED_TIMEOUT_MS = 30_000;

export interface PageSpeedResult {
  /** 0..100 — Lighthouse aggregated category scores. */
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  /** Detailed Core Web Vitals + auxiliary timing metrics. */
  metrics: {
    fcp: number; // First Contentful Paint (ms)
    lcp: number; // Largest Contentful Paint (ms)
    cls: number; // Cumulative Layout Shift (unitless)
    tbt: number; // Total Blocking Time (ms)
    si: number;  // Speed Index (ms)
    tti: number; // Time to Interactive (ms)
  };
}

interface CacheEntry {
  ts: number;
  data: PageSpeedResult;
}

declare global {
  // eslint-disable-next-line no-var
  var __saPageSpeedCache: Map<string, CacheEntry> | undefined;
}

function getCache(): Map<string, CacheEntry> {
  if (!globalThis.__saPageSpeedCache) {
    globalThis.__saPageSpeedCache = new Map();
  }
  return globalThis.__saPageSpeedCache;
}

function cacheKey(url: string, strategy: 'mobile' | 'desktop'): string {
  return `${url}::${strategy}`;
}

/**
 * Fetch (or read from cache) the PageSpeed result for a given URL +
 * strategy. Returns `null` when no API key is configured OR the
 * upstream call fails. Caller decides whether to estimate locally or
 * surface a "données indisponibles" state.
 */
export async function fetchPageSpeed(
  url: string,
  strategy: 'mobile' | 'desktop' = 'mobile',
): Promise<PageSpeedResult | null> {
  const cache = getCache();
  const key = cacheKey(url, strategy);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!apiKey) return null;

  const apiUrl =
    `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
    `?url=${encodeURIComponent(url)}` +
    `&key=${apiKey}` +
    `&category=performance&category=accessibility&category=best-practices&category=seo` +
    `&strategy=${strategy}`;

  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(PAGESPEED_TIMEOUT_MS) });
    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`PageSpeed API ${res.status}: ${errorText.slice(0, 200)}`);
    }
    const data = await res.json();
    if (!data?.lighthouseResult?.categories) {
      throw new Error('Invalid PageSpeed API response structure');
    }

    const cats = data.lighthouseResult.categories;
    const audits = data.lighthouseResult.audits ?? {};

    // Scores are 0..1 from the API; we expose 0..100 to match the rest
    // of the analyzer codebase.
    const result: PageSpeedResult = {
      performance:   Math.round((cats.performance?.score        ?? 0) * 100),
      accessibility: Math.round((cats.accessibility?.score      ?? 0) * 100),
      bestPractices: Math.round((cats['best-practices']?.score  ?? 0) * 100),
      seo:           Math.round((cats.seo?.score                ?? 0) * 100),
      metrics: {
        fcp: audits['first-contentful-paint']?.numericValue   ?? 0,
        lcp: audits['largest-contentful-paint']?.numericValue ?? 0,
        cls: audits['cumulative-layout-shift']?.numericValue  ?? 0,
        tbt: audits['total-blocking-time']?.numericValue      ?? 0,
        si:  audits['speed-index']?.numericValue              ?? 0,
        tti: audits.interactive?.numericValue                 ?? 0,
      },
    };

    cache.set(key, { ts: Date.now(), data: result });
    return result;
  } catch (err) {
    console.error(`[PageSpeed] ${strategy} failed for ${url}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

/** Test-only — clear the in-memory cache. */
export function _clearPageSpeedCache(): void {
  getCache().clear();
}
