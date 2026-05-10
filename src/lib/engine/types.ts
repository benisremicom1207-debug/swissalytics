/**
 * Engine types — shared contract between crawler, storage, and UI.
 *
 * The repository stores `StoredReport`. The UI consumes `AnalysisReport`.
 * They share the same shape; `StoredReport` adds bookkeeping columns.
 */

import type { AnalysisResult, CwvMetrics, Issue } from '@/lib/types';
import type { GeoAnalysisResult } from '@/lib/analyzers/types';

/**
 * CWV enrichment payload — mirrors the /api/analyze/cwv response shape.
 * Persisted as `reports.cwv` JSONB so /r/<id> and /s/<slug> can rehydrate
 * the same technical-score adjustment the live page applied.
 */
export interface CwvEnrichment {
  coreWebVitals: { mobile: CwvMetrics | null; desktop: CwvMetrics | null } | null;
  cwvIssues: Issue[];
  cwvScorePenalty: number;
}

export type Lang = 'fr' | 'en';

/**
 * The canonical UI-facing report shape.
 * We currently reuse `AnalysisResult` (legacy) with a few additions.
 * Migrate fields in over time; don't break this contract.
 */
export type AnalysisReport = AnalysisResult & {
  /** Stable id — nanoid(12), URL-safe */
  id: string;
  /** ISO timestamp */
  createdAt: string;
  /** Language at the time of the analysis */
  lang: Lang;
  /** Total crawl duration in ms (observability) */
  crawlMs: number;
  /** Optional — set when a share link has been minted */
  shareToken?: string;
  /** Optional — expiration of the share token (ISO) */
  shareExpiresAt?: string;
};

/**
 * Shape persisted by the repository.
 * Plain fields are indexable columns; the full report lives in `data`.
 *
 * The retargeting metadata fields (ipHash, country, userAgent, referrer)
 * are optional — older reports created before Phase 1 may lack them.
 */
export interface StoredReport {
  id: string;
  url: string;
  lang: Lang;
  score: number;
  createdAt: number; // unix ms — easier to index than ISO
  crawlMs: number;
  shareToken: string | null;
  shareExpiresAt: number | null; // unix ms
  data: AnalysisReport; // full JSON blob

  // Métadonnées retargeting (Phase 1) — optionnelles pour rétro-compat
  ipHash?: string | null;
  country?: string | null;
  userAgent?: string | null;
  referrer?: string | null;

  // Enrichissement asynchrone (Phase 2) — populé via PATCH .../enrich
  // après les fetches /api/geo-analyze, /api/analyze/cwv et
  // /api/keyword-suggestions (P18.B). Null tant que l'enrichissement
  // n'a pas été persisté.
  geoAnalysis?: GeoAnalysisResult | null;
  cwv?: CwvEnrichment | null;
  /** P18.B — top-level so it can be persisted independently of geoAnalysis. */
  keywordSuggestions?: import('@/lib/analyzers/keyword-suggestions').KeywordSuggestionsResult | null;
}

/** Minimal meta for list/recent queries */
export interface ReportSummary {
  id: string;
  url: string;
  lang: Lang;
  score: number;
  createdAt: number;
  shareToken: string | null;
  shareExpiresAt: number | null;
}
