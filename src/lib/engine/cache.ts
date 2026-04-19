/**
 * LRU memory cache for (url, lang) -> reportId.
 *
 * Purpose: when the same URL is analyzed within DEDUP_WINDOW_MS, serve the
 * existing reportId without re-crawling. Reduces load and speeds up repeat
 * requests from ~15s to ~50ms.
 *
 * This is in-memory only. Swap to Redis in a multi-instance setup.
 */

import type { Lang } from './types';

interface Entry {
  reportId: string;
  ts: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __saUrlCache: Map<string, Entry> | undefined;
}

function getCache(): Map<string, Entry> {
  if (!globalThis.__saUrlCache) {
    globalThis.__saUrlCache = new Map();
  }
  return globalThis.__saUrlCache;
}

const MAX_SIZE = 500;

function makeKey(url: string, lang: Lang): string {
  return `${lang}::${url}`;
}

export function cacheGet(url: string, lang: Lang, maxAgeMs: number): string | null {
  const cache = getCache();
  const key = makeKey(url, lang);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > maxAgeMs) {
    cache.delete(key);
    return null;
  }
  // LRU touch: delete+reinsert to mark as most-recent
  cache.delete(key);
  cache.set(key, entry);
  return entry.reportId;
}

export function cacheSet(url: string, lang: Lang, reportId: string) {
  const cache = getCache();
  const key = makeKey(url, lang);
  cache.set(key, { reportId, ts: Date.now() });
  while (cache.size > MAX_SIZE) {
    // delete the oldest (first key = oldest in Map insertion order)
    const first = cache.keys().next().value;
    if (first === undefined) break;
    cache.delete(first);
  }
}

export function cacheClear() {
  getCache().clear();
}
