/**
 * Display-only link deduplication (P10).
 *
 * Backend `analyzeLinks()` returns the raw DOM-counted list — header
 * + footer + sub-nav often link to the same `/services/` or `/contact/`
 * 2-3 times. Score & total counts use that raw list (correct).
 *
 * For the UI table we prefer one row per canonical href, with:
 *   - all unique non-empty anchor texts seen across occurrences
 *   - an occurrence count (×3) so users still see the duplication
 *   - the OR-union of nofollow/sponsored/ugc attributes — if ANY
 *     occurrence is nofollow, we surface "nofollow" (pessimistic, the
 *     safer default for SEO judgment)
 *
 * Insertion order is preserved so the table reads top-to-bottom in
 * DOM order.
 */

import type { LinkInfo } from '@/lib/types';

export interface DedupedLink {
  href: string;
  /** Unique non-empty anchor texts in the order first seen. */
  texts: string[];
  count: number;
  isNofollow: boolean;
  isSponsored: boolean;
  isUgc: boolean;
}

export function groupLinksByHref(links: LinkInfo[]): DedupedLink[] {
  const map = new Map<string, DedupedLink>();
  for (const link of links) {
    const existing = map.get(link.href);
    if (existing) {
      existing.count += 1;
      if (link.text && !existing.texts.includes(link.text)) {
        existing.texts.push(link.text);
      }
      // OR-merge attributes — if ANY occurrence is nofollow/sponsored/ugc,
      // the link is "marked" with that attribute. Pessimistic on purpose:
      // surfacing nofollow when a single instance has it makes SEO audits
      // safer than accidentally claiming "all dofollow".
      existing.isNofollow = existing.isNofollow || link.isNofollow;
      existing.isSponsored = existing.isSponsored || link.isSponsored;
      existing.isUgc = existing.isUgc || link.isUgc;
    } else {
      map.set(link.href, {
        href: link.href,
        texts: link.text ? [link.text] : [],
        count: 1,
        isNofollow: link.isNofollow,
        isSponsored: link.isSponsored,
        isUgc: link.isUgc,
      });
    }
  }
  return [...map.values()];
}
