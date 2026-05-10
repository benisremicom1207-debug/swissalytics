import { describe, it, expect } from 'vitest';
import { mergeEnrichment } from '../enrich';
import type { AnalysisReport, CwvEnrichment, StoredReport } from '../types';
import type { GeoAnalysisResult } from '@/lib/analyzers/types';

/**
 * mergeEnrichment must produce, when called on a stored row that has both
 * geoAnalysis and cwv populated, the same shape src/app/page.tsx ends up
 * with after both async fetches resolve. These tests pin the contract so
 * /r/<id> and /s/<slug> stay aligned with the live page.
 */

function makeStored(over: Partial<StoredReport> = {}): StoredReport {
  // Minimal AnalysisReport stub that satisfies calculateGlobalScore — every
  // category needs { score, issues }, plus keywords.issues.
  const blank = (score: number) => ({ score, issues: [] });
  const data = {
    score: 80,
    technical: {
      score: 70,
      issues: [{ type: 'info' as const, message: 'baseline' }],
    },
    headings: blank(80),
    images: blank(80),
    links: blank(80),
    metadata: blank(80),
    readability: blank(80),
    keywords: { issues: [] },
  } as unknown as AnalysisReport;

  return {
    id: 'pixelab-ch-test',
    url: 'https://pixelab.ch/',
    lang: 'fr',
    score: 80,
    createdAt: 1746273600000,
    crawlMs: 12000,
    shareToken: null,
    shareExpiresAt: null,
    data,
    ipHash: null,
    country: null,
    userAgent: null,
    referrer: null,
    geoAnalysis: null,
    cwv: null,
    ...over,
  };
}

describe('mergeEnrichment', () => {
  it('returns data unchanged when neither geoAnalysis nor cwv is present', () => {
    const stored = makeStored();
    const merged = mergeEnrichment(stored);
    expect(merged).toBe(stored.data);
  });

  it('attaches geoAnalysis without touching technical or score when only geo is present', () => {
    const geo = { geo: { score: 41 } } as unknown as GeoAnalysisResult;
    const stored = makeStored({ geoAnalysis: geo });
    const merged = mergeEnrichment(stored);
    expect(merged.geoAnalysis).toBe(geo);
    expect(merged.technical.score).toBe(70);
    expect(merged.score).toBe(80);
    expect(merged.technical.issues).toHaveLength(1);
  });

  it('attaches top-level keywordSuggestions (P18.B)', () => {
    const ks = { suggestions: [{ keyword: 'k', rationale: 'r' }], model: 'gemini-2.5-flash' };
    // Cast through unknown because StoredReport.keywordSuggestions is the
    // strict KeywordSuggestionsResult type and we want a minimal stub here.
    const stored = makeStored({ keywordSuggestions: ks as unknown as StoredReport['keywordSuggestions'] });
    const merged = mergeEnrichment(stored);
    expect(merged.keywordSuggestions).toEqual(ks);
  });

  it('hoists legacy geoAnalysis.keywordSuggestions to top-level for backwards compat (P18.B)', () => {
    // Legacy reports stored before P18 had keywordSuggestions INSIDE geo_analysis.
    // mergeEnrichment must surface them at the top so the new UI keeps
    // displaying them after the column split.
    const legacyKs = { suggestions: [{ keyword: 'old', rationale: 'r' }], model: 'gpt-4o-mini' };
    const geo = { geo: { score: 41 }, keywordSuggestions: legacyKs } as unknown as GeoAnalysisResult;
    const stored = makeStored({ geoAnalysis: geo });
    const merged = mergeEnrichment(stored);
    expect(merged.keywordSuggestions).toEqual(legacyKs);
  });

  it('top-level keywordSuggestions wins over legacy nested one when both present', () => {
    const legacyKs = { suggestions: [{ keyword: 'old', rationale: 'r' }], model: 'gpt-4o-mini' };
    const newKs    = { suggestions: [{ keyword: 'new', rationale: 'r' }], model: 'gemini-2.5-flash' };
    const geo = { geo: { score: 41 }, keywordSuggestions: legacyKs } as unknown as GeoAnalysisResult;
    const stored = makeStored({
      geoAnalysis: geo,
      keywordSuggestions: newKs as unknown as StoredReport['keywordSuggestions'],
    });
    const merged = mergeEnrichment(stored);
    expect(merged.keywordSuggestions).toEqual(newKs);
  });

  it('skips CWV merge when coreWebVitals payload is null', () => {
    const cwv: CwvEnrichment = {
      coreWebVitals: null,
      cwvIssues: [{ type: 'warning', message: 'no data' }],
      cwvScorePenalty: 5,
    };
    const stored = makeStored({ cwv });
    const merged = mergeEnrichment(stored);
    expect(merged.technical.score).toBe(70);
    expect(merged.technical.issues).toHaveLength(1);
  });

  it('skips CWV merge when both mobile and desktop are null', () => {
    const cwv: CwvEnrichment = {
      coreWebVitals: { mobile: null, desktop: null },
      cwvIssues: [],
      cwvScorePenalty: 10,
    };
    const merged = mergeEnrichment(makeStored({ cwv }));
    expect(merged.technical.score).toBe(70);
  });

  it('applies CWV penalty + appends issues + recomputes global score when mobile is present', () => {
    const mobile = { lcp: 4500, cls: 0.2, inp: 300 };
    const cwv: CwvEnrichment = {
      coreWebVitals: {
        mobile: mobile as unknown as CwvEnrichment['coreWebVitals'] extends infer T
          ? T extends { mobile: infer M } ? M : never
          : never,
        desktop: null,
      },
      cwvIssues: [
        { type: 'error', message: 'LCP too high' },
        { type: 'warning', message: 'CLS too high' },
      ],
      cwvScorePenalty: 25,
    };
    const merged = mergeEnrichment(makeStored({ cwv }));
    expect(merged.technical.score).toBe(45);
    expect(merged.technical.issues).toHaveLength(3);
    expect(merged.technical.coreWebVitals?.mobile).toBe(mobile);
    expect(merged.score).not.toBe(80);
  });

  it('caps technical.score at 0 when penalty exceeds the original score', () => {
    const cwv: CwvEnrichment = {
      coreWebVitals: { mobile: { lcp: 9999 } as never, desktop: null },
      cwvIssues: [],
      cwvScorePenalty: 999,
    };
    const merged = mergeEnrichment(makeStored({ cwv }));
    expect(merged.technical.score).toBe(0);
  });

  it('combines geoAnalysis attach + CWV apply when both are present', () => {
    const geo = { geo: { score: 60 } } as unknown as GeoAnalysisResult;
    const cwv: CwvEnrichment = {
      coreWebVitals: { mobile: { lcp: 1000 } as never, desktop: null },
      cwvIssues: [{ type: 'info', message: 'fast' }],
      cwvScorePenalty: 5,
    };
    const merged = mergeEnrichment(makeStored({ geoAnalysis: geo, cwv }));
    expect(merged.geoAnalysis).toBe(geo);
    expect(merged.technical.score).toBe(65);
    expect(merged.technical.issues).toHaveLength(2);
  });

  it('does not mutate the input stored.data', () => {
    const stored = makeStored({
      geoAnalysis: { geo: { score: 1 } } as unknown as GeoAnalysisResult,
      cwv: {
        coreWebVitals: { mobile: { lcp: 1 } as never, desktop: null },
        cwvIssues: [{ type: 'error', message: 'm' }],
        cwvScorePenalty: 10,
      },
    });
    const dataSnapshot = JSON.stringify(stored.data);
    mergeEnrichment(stored);
    expect(JSON.stringify(stored.data)).toBe(dataSnapshot);
  });
});
