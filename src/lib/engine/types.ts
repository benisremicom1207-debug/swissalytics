/**
 * Engine types — shared contract between crawler, storage, and UI.
 *
 * The repository stores `StoredReport`. The UI consumes `AnalysisReport`.
 * They share the same shape; `StoredReport` adds bookkeeping columns.
 */

import type { AnalysisResult } from '@/lib/types';

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
