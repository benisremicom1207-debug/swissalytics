/**
 * Background purge — removes old reports + expired share tokens.
 * Hooked at server start via the init module.
 */

import { getReportsRepo, REPORT_RETENTION_MS } from './repositoryInstance';

const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000; // daily

declare global {
  // eslint-disable-next-line no-var
  var __saPurgeTimer: NodeJS.Timeout | undefined;
}

export function startPurgeCron() {
  if (globalThis.__saPurgeTimer) return; // idempotent across hot reloads
  const run = async () => {
    try {
      const repo = getReportsRepo();
      const deleted = await repo.purge(REPORT_RETENTION_MS);
      if (deleted > 0) {
        // eslint-disable-next-line no-console
        console.info(`[purge] removed ${deleted} old reports`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[purge] failed', err);
    }
  };
  // first run 60s after boot, then daily
  const bootTimer = setTimeout(run, 60_000);
  const interval = setInterval(run, PURGE_INTERVAL_MS);
  globalThis.__saPurgeTimer = interval;
  if (typeof bootTimer.unref === 'function') bootTimer.unref();
  if (typeof interval.unref === 'function') interval.unref();
}
