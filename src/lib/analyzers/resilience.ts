/**
 * Resilience helpers for /api/geo-analyze (P8).
 *
 * Before P8, the route used `Promise.all` over 5 analyzers — if any
 * one rejected (timeout, transient HTTP error on Lighthouse or LLM
 * APIs), the whole request 500'd and the user got nothing.
 *
 * This module provides:
 *   - `withTimeout(promise, ms, label)` — races a promise against a
 *     deadline, rejecting with a labeled timeout error past `ms`.
 *   - Per-analyzer fallback factories — sentinel result objects with
 *     score=0 and empty signals, used when an analyzer fails so the
 *     composite calculation still completes (degraded but non-empty).
 *
 * The route layer then uses `Promise.allSettled` over the 5 wrapped
 * analyzers and substitutes fallbacks for rejections, surfacing a
 * `degraded: { ...flags }` block to the client so the UI can show
 * "données partielles".
 */

import type { LighthouseResult } from './lighthouse';
import type { SEOResult } from './seo';
import type { GEOIndexationResult } from './geo-indexation';
import type { SchemaOrgResult } from './schema-org';
import type { EEATResult } from './eeat';

export interface TimeoutError extends Error {
  readonly isTimeout: true;
  readonly label: string;
  readonly ms: number;
}

/**
 * Race a promise against a timeout. On timeout, rejects with an Error
 * carrying `{ isTimeout: true, label, ms }` so the catch site can
 * distinguish timeout vs. real rejection.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      const err = new Error(`${label} timeout after ${ms}ms`) as TimeoutError;
      (err as { isTimeout: boolean }).isTimeout = true;
      (err as { label: string }).label = label;
      (err as { ms: number }).ms = ms;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }) as Promise<T>;
}

/* --------------- per-analyzer fallback factories --------------- */

/** Sentinel Lighthouse result (all-zero scores, isEstimated=true). */
export function lighthouseFallback(reason: string): LighthouseResult {
  return {
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0,
    metrics: { fcp: 0, lcp: 0, cls: 0, tti: 0 },
    isEstimated: true,
    warning: `Lighthouse indisponible : ${reason}`,
  };
}

export function seoFallback(): SEOResult {
  return {
    score: 0,
    metaTags: {
      score: 0,
      title:       { found: false, length: 0, optimal: false },
      description: { found: false, length: 0, optimal: false },
      ogImage: false,
      ogTitle: false,
      ogDescription: false,
      canonical: false,
    },
    headings: { score: 0, h1Count: 0, h2Count: 0, structure: 'Mauvaise' },
    images:   { score: 0, totalImages: 0, withAlt: 0, missingAlt: 0, percentageWithAlt: 0 },
    sitemap: false,
    robots: false,
    coreWebVitals: { lcp: 0, fid: 0, cls: 0 },
  };
}

export function geoIndexationFallback(): GEOIndexationResult {
  return {
    score: 0,
    engines: {},
    totalIndexed: 0,
    totalEnabled: 0,
    region: undefined,
    recommendations: [],
  };
}

export function schemaOrgFallback(): SchemaOrgResult {
  return {
    score: 0,
    schemas: { organization: false, author: false, faqPage: false, breadcrumb: false, article: false, website: false },
    totalFound: 0,
    details: {},
    errors: [],
    recommendations: [],
  };
}

export function eeatFallback(): EEATResult {
  return {
    score: 0,
    signals: {
      teamPage:    { found: false, quality: 'none', authorsCount: 0 },
      legalMentions: false,
      contactPage: { found: false, hasEmail: false, hasPhone: false, hasAddress: false },
      testimonials: { found: false, count: 0, hasSchema: false },
      backlinks:   { total: 0, quality: 'none', domains: 0 },
      authorBios:  { found: false, count: 0 },
    },
    recommendations: [],
  };
}

/* --------------- aggregated degraded flag --------------- */

export interface DegradedFlags {
  lighthouse: boolean;
  seo: boolean;
  geo: boolean;
  schema: boolean;
  eeat: boolean;
}

export function isAnyDegraded(d: DegradedFlags): boolean {
  return d.lighthouse || d.seo || d.geo || d.schema || d.eeat;
}

/* --------------- typed wrapper for `allSettled` results --------------- */

/**
 * Resolve a `PromiseSettledResult` into either the value or a fallback,
 * recording whether the fallback was used (= analyzer was degraded).
 */
export function resolveOrFallback<T>(
  settled: PromiseSettledResult<T>,
  fallback: () => T,
  onDegraded?: (reason: string) => void,
): T {
  if (settled.status === 'fulfilled') return settled.value;
  const reason =
    settled.reason instanceof Error ? settled.reason.message : String(settled.reason);
  onDegraded?.(reason);
  return fallback();
}
