/**
 * The single repository instance used by API routes.
 *
 * ============================================================
 * DB SWAP POINT — change ONLY this file to use a real DB.
 * ============================================================
 * See DB_SWAP.md in this folder for how to plug in SQLite/Postgres.
 *
 * Guarded against Next.js hot-reload in dev by attaching to `globalThis`.
 */

import type { ReportsRepository } from './repository';
import { InMemoryReportsRepository } from './inMemoryRepository';
import { startPurgeCron } from './purge';

declare global {
  // eslint-disable-next-line no-var
  var __saReportsRepo: ReportsRepository | undefined;
}

function createRepo(): ReportsRepository {
  // To swap to SQLite/Postgres, replace this line with your own impl:
  //   return new SqliteReportsRepository(process.env.DATABASE_URL!);
  return new InMemoryReportsRepository();
}

export function getReportsRepo(): ReportsRepository {
  if (!globalThis.__saReportsRepo) {
    globalThis.__saReportsRepo = createRepo();
    // Side-effect: spin up the daily purge cron once the repo is first used.
    startPurgeCron();
  }
  return globalThis.__saReportsRepo;
}

/** Policy — keep these constants near the repo so they're DB-aware */
export const REPORT_RETENTION_MS = 180 * 24 * 60 * 60 * 1000; // 180 days
export const SHARE_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;   // 30 days
export const DEDUP_WINDOW_MS    = 60 * 60 * 1000;             // 1 hour
