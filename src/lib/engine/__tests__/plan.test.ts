import { describe, it, expect } from 'vitest';
import { buildPlan } from '../plan';
import type { AnalysisResult, Issue } from '@/lib/types';
import type {
  GeoAnalysisResult,
  GeoRecommendation,
} from '@/lib/analyzers/types';

/**
 * buildPlan tests — pin the dedup, severity bucketing, and unified sort
 * contract used by the action-plan tab. Native issues + geoAnalysis
 * recommendations have to interleave coherently in the same buckets.
 */

function issue(type: Issue['type'], message: string): Issue {
  return { type, message };
}

function reco(over: Partial<GeoRecommendation> = {}): GeoRecommendation {
  return {
    priority: 'high',
    title: 'Test reco',
    description: 'Test description',
    impact: 10,
    difficulty: 'medium',
    category: 'seo',
    timeframe: '1 semaine',
    ...over,
  };
}

function makeResult(over: Partial<AnalysisResult> = {}): AnalysisResult {
  const blank = (score: number, issues: Issue[] = []) => ({ score, issues });
  return {
    url: 'https://pixelab.ch/',
    timestamp: '2026-05-09T00:00:00Z',
    score: 70,
    keywords: { keywords: [], placement: null, targets: [], issues: [] },
    headings: blank(80) as unknown as AnalysisResult['headings'],
    images: blank(80) as unknown as AnalysisResult['images'],
    links: blank(80) as unknown as AnalysisResult['links'],
    technical: blank(80) as unknown as AnalysisResult['technical'],
    metadata: blank(80) as unknown as AnalysisResult['metadata'],
    readability: blank(80) as unknown as AnalysisResult['readability'],
    ...over,
  };
}

describe('buildPlan — native-only behavior (regression)', () => {
  it('returns empty when no issues anywhere', () => {
    expect(buildPlan(makeResult())).toEqual([]);
  });

  it('numbers items 1..N globally across buckets', () => {
    const result = makeResult({
      headings: { score: 60, issues: [issue('error', 'H1 missing')] } as unknown as AnalysisResult['headings'],
      images: { score: 60, issues: [issue('warning', '5 images sans alt')] } as unknown as AnalysisResult['images'],
      links: { score: 60, issues: [issue('info', 'Anchors génériques')] } as unknown as AnalysisResult['links'],
    });
    const plan = buildPlan(result);
    expect(plan.map((p) => p.n)).toEqual([1, 2, 3]);
    expect(plan.map((p) => p.bucket)).toEqual(['crit', 'warn', 'info']);
  });

  it('dedupes same fix-pattern across digit variants and stamps count', () => {
    const result = makeResult({
      images: {
        score: 60,
        issues: [
          issue('warning', '52 images sans alt'),
          issue('warning', '9 images sans alt'),
        ],
      } as unknown as AnalysisResult['images'],
    });
    const plan = buildPlan(result);
    expect(plan).toHaveLength(1);
    expect(plan[0].count).toBe(2);
    expect(plan[0].title).toMatch(/×2/);
  });

  it('marks all native items with source: "native"', () => {
    const result = makeResult({
      headings: { score: 60, issues: [issue('error', 'H1 missing')] } as unknown as AnalysisResult['headings'],
    });
    const plan = buildPlan(result);
    expect(plan[0].source).toBe('native');
  });
});

describe('buildPlan — geo recommendations integration (P4.1)', () => {
  it('absorbs geoAnalysis.recommendations as plan items', () => {
    const result = makeResult({
      geoAnalysis: {
        recommendations: [reco({ title: 'Optimiser perf', priority: 'critical' })],
      } as unknown as GeoAnalysisResult,
    });
    const plan = buildPlan(result);
    expect(plan).toHaveLength(1);
    expect(plan[0].title).toBe('Optimiser perf');
    expect(plan[0].source).toBe('geo');
  });

  it('uses recommendation.description as the body (not title)', () => {
    const result = makeResult({
      geoAnalysis: {
        recommendations: [
          reco({ title: 'Court', description: 'Description longue détaillée' }),
        ],
      } as unknown as GeoAnalysisResult,
    });
    const plan = buildPlan(result);
    expect(plan[0].body).toBe('Description longue détaillée');
  });

  it('labels category "GEO IA" / "SEO IA" depending on reco.category', () => {
    const result = makeResult({
      geoAnalysis: {
        recommendations: [
          reco({ title: 'A', category: 'seo' }),
          reco({ title: 'B', category: 'geo' }),
        ],
      } as unknown as GeoAnalysisResult,
    });
    const plan = buildPlan(result);
    const cats = plan.map((p) => p.category).sort();
    expect(cats).toEqual(['GEO IA', 'SEO IA']);
  });

  it('returns no extra items when geoAnalysis.recommendations is empty', () => {
    const result = makeResult({
      geoAnalysis: { recommendations: [] } as unknown as GeoAnalysisResult,
    });
    expect(buildPlan(result)).toEqual([]);
  });

  it('returns no extra items when geoAnalysis is undefined', () => {
    const result = makeResult();
    expect(buildPlan(result)).toEqual([]);
  });
});

describe('buildPlan — priority → bucket mapping (P4.2)', () => {
  it('routes critical and high to crit bucket', () => {
    const result = makeResult({
      geoAnalysis: {
        recommendations: [
          reco({ title: 'Crit', priority: 'critical' }),
          reco({ title: 'Hi', priority: 'high' }),
        ],
      } as unknown as GeoAnalysisResult,
    });
    const plan = buildPlan(result);
    expect(plan.every((p) => p.bucket === 'crit')).toBe(true);
  });

  it('routes medium to warn bucket', () => {
    const result = makeResult({
      geoAnalysis: {
        recommendations: [reco({ title: 'Med', priority: 'medium' })],
      } as unknown as GeoAnalysisResult,
    });
    expect(buildPlan(result)[0].bucket).toBe('warn');
  });

  it('routes low to info bucket', () => {
    const result = makeResult({
      geoAnalysis: {
        recommendations: [reco({ title: 'Lo', priority: 'low' })],
      } as unknown as GeoAnalysisResult,
    });
    expect(buildPlan(result)[0].bucket).toBe('info');
  });
});

describe('buildPlan — difficulty → effort mapping', () => {
  it.each([
    ['low', 'S'],
    ['medium', 'M'],
    ['high', 'L'],
  ] as const)('difficulty %s → effort %s', (difficulty, effort) => {
    const result = makeResult({
      geoAnalysis: {
        recommendations: [reco({ difficulty })],
      } as unknown as GeoAnalysisResult,
    });
    expect(buildPlan(result)[0].effort).toBe(effort);
  });
});

describe('buildPlan — sort order (P4.3)', () => {
  it('within crit bucket: high-impact geo (impact=25) outranks generic native error', () => {
    // Generic native error in 'Lisibilité' (no category boost) ≈ score 100.
    // Geo critical with impact=25 → sortWeight = 125, should come first.
    const result = makeResult({
      readability: {
        score: 60,
        issues: [issue('error', 'Generic readability error')],
      } as unknown as AnalysisResult['readability'],
      geoAnalysis: {
        recommendations: [
          reco({ title: 'High-impact geo', priority: 'critical', impact: 25 }),
        ],
      } as unknown as GeoAnalysisResult,
    });
    const plan = buildPlan(result);
    expect(plan[0].title).toBe('High-impact geo');
    expect(plan[1].title).toBe('Generic readability error');
  });

  it('within crit bucket: low-impact geo (impact=5) ranks below boosted native error', () => {
    // Technique error: 100 + 15 = 115. Geo critical impact=5 → 25. Native wins.
    const result = makeResult({
      technical: {
        score: 60,
        issues: [issue('error', 'Tech critical error')],
      } as unknown as AnalysisResult['technical'],
      geoAnalysis: {
        recommendations: [
          reco({ title: 'Low-impact geo', priority: 'critical', impact: 5 }),
        ],
      } as unknown as GeoAnalysisResult,
    });
    const plan = buildPlan(result);
    expect(plan[0].title).toBe('Tech critical error');
    expect(plan[1].title).toBe('Low-impact geo');
  });

  it('preserves severity-tier ordering: errors before warnings before info', () => {
    const result = makeResult({
      headings: { score: 60, issues: [issue('info', 'H info')] } as unknown as AnalysisResult['headings'],
      geoAnalysis: {
        recommendations: [
          reco({ title: 'GeoLow', priority: 'low', impact: 30 }), // info
          reco({ title: 'GeoMed', priority: 'medium', impact: 20 }), // warn
          reco({ title: 'GeoCrit', priority: 'critical', impact: 10 }), // crit
        ],
      } as unknown as GeoAnalysisResult,
    });
    const plan = buildPlan(result);
    expect(plan.map((p) => p.bucket)).toEqual(['crit', 'warn', 'info', 'info']);
  });
});

describe('buildPlan — mixed source integration', () => {
  it('keeps native and geo items in the same plan with continuous numbering', () => {
    const result = makeResult({
      headings: {
        score: 60,
        issues: [issue('error', 'H1 absent')],
      } as unknown as AnalysisResult['headings'],
      images: {
        score: 60,
        issues: [issue('warning', '5 images sans alt')],
      } as unknown as AnalysisResult['images'],
      geoAnalysis: {
        recommendations: [
          reco({ title: 'Geo crit', priority: 'critical', impact: 22 }),
          reco({ title: 'Geo info', priority: 'low', impact: 5 }),
        ],
      } as unknown as GeoAnalysisResult,
    });
    const plan = buildPlan(result);
    expect(plan).toHaveLength(4);
    expect(plan.map((p) => p.n)).toEqual([1, 2, 3, 4]);
    // Sources preserved
    const sources = plan.map((p) => `${p.source}:${p.title}`);
    expect(sources).toContain('native:H1 absent');
    expect(sources).toContain('geo:Geo crit');
  });
});
