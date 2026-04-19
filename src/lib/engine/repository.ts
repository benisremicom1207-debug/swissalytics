/**
 * ReportsRepository — persistence interface.
 *
 * Swap the implementation in `repositoryInstance.ts` to move from in-memory
 * to SQLite, Postgres, etc. The rest of the app only depends on this interface.
 */

import type { Lang, ReportSummary, StoredReport } from './types';

export interface ReportsRepository {
  /** Persist a new report. Throws on id collision. */
  save(report: StoredReport): Promise<void>;

  /** Fetch a report by id. Returns null if not found. */
  getById(id: string): Promise<StoredReport | null>;

  /**
   * Fetch a report by share token.
   * Implementations MUST respect `shareExpiresAt` — return null if expired.
   */
  getByShareToken(token: string): Promise<StoredReport | null>;

  /**
   * Attach or replace a share token + expiration on an existing report.
   * Returns the updated StoredReport, or null if id not found.
   */
  setShareToken(
    id: string,
    token: string,
    expiresAt: number,
  ): Promise<StoredReport | null>;

  /**
   * Clear the share token (revoke sharing).
   */
  clearShareToken(id: string): Promise<StoredReport | null>;

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
}
