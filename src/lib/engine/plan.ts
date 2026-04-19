/**
 * Plan builder — derives a prioritized action plan from the raw issues.
 *
 * Strategy:
 * 1. Flatten issues from every sub-analysis into a single list with category tags.
 * 2. Dedupe by (category + fix-pattern) so "52 images without alt" becomes ONE
 *    action item referencing 52 source issues, not 52 line items.
 * 3. Bucket by severity: error → crit, warning → warn, info → info.
 * 4. Sort each bucket by an heuristic impact score.
 * 5. Number 1..N globally (across buckets).
 * 6. Attach an effort hint (S/M/L) per rule category.
 */

import type { AnalysisResult, Issue } from '@/lib/types';

export type Severity = 'error' | 'warning' | 'info';
export type PlanBucket = 'crit' | 'warn' | 'info';
export type Effort = 'S' | 'M' | 'L';

export interface PlanIssue {
  type: Severity;
  category: string;
  message: string;
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
      });
    }
  }
  return out;
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
 * Score an issue by its likely fix impact (used only to sort within a bucket).
 * Heavier weight for SEO-load-bearing categories.
 */
function impactScore(iss: PlanIssue): number {
  let s = iss.type === 'error' ? 100 : iss.type === 'warning' ? 50 : 10;
  if (iss.category === 'Technique' || iss.category === 'IA-Ready') s += 15;
  if (iss.category === 'Headings' || iss.category === 'Métadonnées') s += 10;
  if (iss.category === 'Images' || iss.category === 'Liens') s += 5;
  return s;
}

export function buildPlan(result: AnalysisResult): PlanItem[] {
  const raw = collectIssues(result);

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
    return impactScore(b.sample) - impactScore(a.sample);
  });

  return deduped.map((entry, i): PlanItem => {
    const iss = entry.sample;
    const title =
      entry.count > 1 ? `${iss.message} (×${entry.count})` : iss.message;
    return {
      n: i + 1,
      bucket: bucketOf[iss.type],
      title,
      body: iss.message,
      effort: categoryEffort[iss.category] ?? 'M',
      count: entry.count,
      category: iss.category,
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
