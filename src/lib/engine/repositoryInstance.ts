/**
 * The single repository instance used by API routes.
 *
 * Swappable through the ReportsRepository interface — change `createRepo`
 * below to use a different backend. Production: Supabase Postgres (Zurich).
 */

import type { ReportsRepository } from './repository';
import { SupabaseReportsRepository } from './supabaseRepository';
import { startPurgeCron } from './purge';

declare global {
  // eslint-disable-next-line no-var
  var __saReportsRepo: ReportsRepository | undefined;
}

function createRepo(): ReportsRepository {
  return new SupabaseReportsRepository();
}

export function getReportsRepo(): ReportsRepository {
  if (!globalThis.__saReportsRepo) {
    globalThis.__saReportsRepo = createRepo();
    startPurgeCron();
  }
  return globalThis.__saReportsRepo;
}

/** Policies — keep these constants near the repo so they're DB-aware */
export const REPORT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000; // 180 days
export const SHARE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;   // 30 days
export const DEDUP_WINDOW_MS    = 60 * 60 * 1000;             // 1 hour
