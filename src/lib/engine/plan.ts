/**
 * Plan builder — derives a prioritized action plan from the raw issues +
 * geoAnalysis recommendations (P4).
 *
 * Strategy:
 * 1. Flatten issues from every sub-analysis into a single list with category tags.
 * 2. Append geoAnalysis.recommendations as same-shape entries (priority →
 *    severity, difficulty → effort, recommendation.impact preserved for sort).
 * 3. Dedupe by (category + fix-pattern) so "52 images without alt" becomes ONE
 *    action item referencing 52 source issues, not 52 line items.
 * 4. Bucket by severity: error → crit, warning → warn, info → info.
 * 5. Sort each bucket by a unified weight (geo `impact * 5` vs native heuristic),
 *    so a high-impact GEO recommendation can outrank a generic native error
 *    inside the same urgency tier.
 * 6. Number 1..N globally (across buckets).
 * 7. Attach an effort hint (S/M/L) — explicit on geo items, looked up by
 *    category for native ones.
 */

import type { AnalysisResult, Issue } from '@/lib/types';
import type {
  GeoRecommendationPriority,
  GeoRecommendationDifficulty,
} from '@/lib/analyzers/types';

export type Severity = 'error' | 'warning' | 'info';
export type PlanBucket = 'crit' | 'warn' | 'info';
export type Effort = 'S' | 'M' | 'L';
export type PlanSource = 'native' | 'geo';

export interface PlanIssue {
  type: Severity;
  category: string;
  message: string;
  /** Longer body — used by geo recommendations (falls back to `message`). */
  description?: string;
  /** Explicit numeric impact (geo recommendations only). When set, overrides
   * the native heuristic for sort ordering inside the bucket. */
  impact?: number;
  /** Explicit effort (geo recommendations only). When unset, the builder
   * falls back to a lookup keyed on `category`. */
  effort?: Effort;
  source: PlanSource;
}

export interface PlanItem {
  /** 1-based display number (global across buckets) */
  n: number;
  bucket: PlanBucket;
  title: string;
  body: string;
  effort: Effort;
  count: number; // how many raw issues this rolls up
  category: string;
  source: PlanSource;
}

const categoryEffort: Record<string, Effort> = {
  Metadata: 'S',
  Métadonnées: 'S',
  Technical: 'S',
  Technique: 'S',
  'IA-Ready': 'S',
  'AI-Ready': 'S',
  Links: 'M',
  Liens: 'M',
  Images: 'M',
  Headings: 'M',
  Content: 'M',
  Contenu: 'M',
  Readability: 'M',
  Lisibilité: 'M',
};

/**
 * GEO recommendations carry their own priority. We map them onto the existing
 * severity tier so the bucketing stays a 3-way split (crit/warn/info):
 *   critical, high → error  (urgent)
 *   medium         → warning
 *   low            → info
 * `high` and `critical` collapse together because the action plan UI only has
 * one "critical" bucket — the explicit `impact` weight preserves their
 * relative ordering within the bucket.
 */
const priorityToSeverity: Record<GeoRecommendationPriority, Severity> = {
  critical: 'error',
  high: 'error',
  medium: 'warning',
  low: 'info',
};

const difficultyToEffort: Record<GeoRecommendationDifficulty, Effort> = {
  low: 'S',
  medium: 'M',
  high: 'L',
};

/** Collect all issues from an AnalysisResult and tag them with a category. */
function collectIssues(result: AnalysisResult): PlanIssue[] {
  const out: PlanIssue[] = [];
  const buckets: Array<[string, Issue[] | undefined]> = [
    ['Headings', result.headings?.issues],
    ['Images', result.images?.issues],
    ['Liens', result.links?.issues],
    ['Technique', result.technical?.issues],
    ['Métadonnées', result.metadata?.issues],
    ['Lisibilité', result.readability?.issues],
    ['Contenu', result.keywords?.issues],
  ];
  for (const [cat, issues] of buckets) {
    if (!issues) continue;
    for (const iss of issues) {
      out.push({
        type: (iss.type ?? 'info') as Severity,
        category: cat,
        message: iss.message,
        source: 'native',
      });
    }
  }
  return out;
}

/**
 * Convert geoAnalysis.recommendations into PlanIssue entries (P4.1, P4.2).
 * Preserves `impact` and `effort` so the sort/effort logic can use the
 * explicit values instead of the category heuristic.
 */
function collectGeoRecs(result: AnalysisResult): PlanIssue[] {
  const recos = result.geoAnalysis?.recommendations;
  if (!recos || recos.length === 0) return [];
  return recos.map((r): PlanIssue => ({
    type: priorityToSeverity[r.priority],
    category: r.category === 'geo' ? 'GEO IA' : 'SEO IA',
    message: r.title,
    description: r.description,
    impact: r.impact,
    effort: difficultyToEffort[r.difficulty],
    source: 'geo',
  }));
}

/**
 * Turn a free-form issue message into a "fix-pattern" key for deduplication.
 * We strip digits + quoted strings so "52 images without alt" and "9 images
 * without alt" collapse to the same pattern.
 */
function fixKey(cat: string, message: string): string {
  const normalized = message
    .toLowerCase()
    .replace(/"[^"]*"/g, '_')
    .replace(/«[^»]*»/g, '_')
    .replace(/\d+/g, '#')
    .replace(/\s+/g, ' ')
    .trim();
  return `${cat}::${normalized}`;
}

const severityOrder: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
const bucketOf: Record<Severity, PlanBucket> = {
  error: 'crit',
  warning: 'warn',
  info: 'info',
};

/**
 * Score a native issue by likely fix impact (heuristic 10..115 range).
 * Heavier weight for SEO-load-bearing categories.
 */
function nativeImpactScore(iss: PlanIssue): number {
  let s = iss.type === 'error' ? 100 : iss.type === 'warning' ? 50 : 10;
  if (iss.category === 'Technique' || iss.category === 'IA-Ready') s += 15;
  if (iss.category === 'Headings' || iss.category === 'Métadonnées') s += 10;
  if (iss.category === 'Images' || iss.category === 'Liens') s += 5;
  return s;
}

/**
 * Unified sort weight (P4.3) used WITHIN a bucket. Geo `impact` is in the
 * 5..30 range; we scale by 5 so a high-impact geo reco can outrank a generic
 * native error inside the same severity tier.
 */
function sortWeight(iss: PlanIssue): number {
  if (iss.source === 'geo' && typeof iss.impact === 'number') {
    return iss.impact * 5;
  }
  return nativeImpactScore(iss);
}

export function buildPlan(result: AnalysisResult): PlanItem[] {
  const raw = [...collectIssues(result), ...collectGeoRecs(result)];

  // dedupe by fix-pattern, keeping the severity+category of the first seen
  const grouped = new Map<string, { sample: PlanIssue; count: number }>();
  for (const iss of raw) {
    const k = fixKey(iss.category, iss.message);
    const existing = grouped.get(k);
    if (existing) {
      existing.count += 1;
      // prefer higher severity sample
      if (severityOrder[iss.type] < severityOrder[existing.sample.type]) {
        existing.sample = iss;
      }
    } else {
      grouped.set(k, { sample: iss, count: 1 });
    }
  }

  const deduped = [...grouped.values()].sort((a, b) => {
    const sev = severityOrder[a.sample.type] - severityOrder[b.sample.type];
    if (sev !== 0) return sev;
    return sortWeight(b.sample) - sortWeight(a.sample);
  });

  return deduped.map((entry, i): PlanItem => {
    const iss = entry.sample;
    const title =
      entry.count > 1 ? `${iss.message} (×${entry.count})` : iss.message;
    return {
      n: i + 1,
      bucket: bucketOf[iss.type],
      title,
      body: iss.description ?? iss.message,
      effort: iss.effort ?? categoryEffort[iss.category] ?? 'M',
      count: entry.count,
      category: iss.category,
      source: iss.source,
    };
  });
}

/** Verdict for the overall score, matching COPY.states. */
export type Verdict = 'clean' | 'mixed' | 'failing';
export function verdictOf(score: number): Verdict {
  if (score >= 85) return 'clean';
  if (score >= 65) return 'mixed';
  return 'failing';
}
