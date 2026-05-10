/**
 * Client-side enrichment helpers — shared by `page.tsx` (live analysis)
 * and `/r/[id]/page.tsx` (stored report rehydration).
 *
 * Without this, /r/[id] silently never triggers /api/geo-analyze on
 * stored reports that lack `geoAnalysis`, leaving the GEO tab stuck on
 * the "scanning" empty state forever. Same applies to CWV.
 *
 * Each helper is a pure async function returning the data (or null on
 * failure) — the caller owns state updates + persistence so React state
 * shape stays local to each page.
 */

import type { GeoAnalysisResult } from '@/lib/analyzers/types';
import type { CwvMetrics, Issue } from '@/lib/types';

export interface CwvEnrichmentData {
  coreWebVitals: { mobile: CwvMetrics | null; desktop: CwvMetrics | null };
  cwvScorePenalty: number;
  cwvIssues: Issue[];
}

/**
 * Fire-and-forget PATCH to persist async enrichment so /r/<id> and
 * /s/<slug> rehydrate the same enriched view later. Failures are
 * silently swallowed — enrichment is best-effort.
 */
export function persistEnrichment(
  reportId: string,
  patch: { geoAnalysis?: unknown; cwv?: unknown },
): void {
  fetch(`/api/report/${reportId}/enrich`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch(() => {});
}

/**
 * Trigger /api/geo-analyze for `url` and return the result, or null on
 * any failure (HTTP non-2xx, network error, malformed JSON).
 */
export async function fetchGeo(url: string): Promise<GeoAnalysisResult | null> {
  try {
    const res = await fetch('/api/geo-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    return (await res.json()) as GeoAnalysisResult;
  } catch {
    return null;
  }
}

/**
 * Trigger /api/analyze/cwv for `url`. Returns null when:
 *   - HTTP fails
 *   - response has no usable Core Web Vitals (both mobile + desktop null)
 * Filtering null-CWV here means callers don't need to repeat the check.
 */
export async function fetchCwv(url: string): Promise<CwvEnrichmentData | null> {
  try {
    const res = await fetch('/api/analyze/cwv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as CwvEnrichmentData;
    if (
      !data?.coreWebVitals ||
      (!data.coreWebVitals.mobile && !data.coreWebVitals.desktop)
    ) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
