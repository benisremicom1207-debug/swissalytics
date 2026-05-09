/**
 * ReportsRepository — persistence interface.
 *
 * Production impl: `SupabaseReportsRepository`, wired in `repositoryInstance.ts`.
 * Swap that one line to move to a different backend. The rest of the app
 * only depends on this interface.
 */

import type { CwvEnrichment, Lang, ReportSummary, StoredReport } from './types';
import type { GeoAnalysisResult } from '@/lib/analyzers/types';

/** Patch payload for enrich() — at least one field must be present. */
export interface EnrichPatch {
  geoAnalysis?: GeoAnalysisResult;
  cwv?: CwvEnrichment;
}

export interface ReportsRepository {
  /** Persist a new report. Throws on id collision. */
  save(report: StoredReport): Promise<void>;

  /** Fetch a report by id. Returns null if not found. */
  getById(id: string): Promise<StoredReport | null>;

  /**
   * Enable sharing on a report — sets `shareExpiresAt = expiresAt`.
   * Returns the updated StoredReport, or null if id not found.
   */
  enableSharing(id: string, expiresAt: number): Promise<StoredReport | null>;

  /**
   * Disable sharing — clears `shareExpiresAt`.
   * Returns the updated StoredReport, or null if id not found.
   */
  disableSharing(id: string): Promise<StoredReport | null>;

  /**
   * Fetch a report by slug, BUT only if sharing is enabled and not expired.
   * Used by the public /s/<slug> route. Returns null if:
   *   - no row with that id
   *   - shareExpiresAt is null (sharing disabled)
   *   - shareExpiresAt < Date.now() (sharing expired)
   */
  getSharedReport(id: string): Promise<StoredReport | null>;

  /**
   * Find the most recent report for a (url, lang) pair created within `maxAgeMs`.
   * Used for deduplication — if a site was analyzed < 1h ago, reuse it.
   * Returns null if none matches.
   */
  findRecent(
    url: string,
    lang: Lang,
    maxAgeMs: number,
  ): Promise<StoredReport | null>;

  /**
   * Delete reports older than `olderThanMs` AND expired share tokens.
   * Returns the number of deleted rows.
   */
  purge(olderThanMs: number): Promise<number>;

  /** Light metadata listing — used for admin/stats later. */
  listRecent(limit: number): Promise<ReportSummary[]>;

  /**
   * Patch the asynchronously-fetched enrichment (geoAnalysis + cwv).
   * Only the keys present in `patch` are written; missing keys are left untouched.
   * Returns the updated StoredReport, or null if id not found.
   */
  enrich(id: string, patch: EnrichPatch): Promise<StoredReport | null>;
}
