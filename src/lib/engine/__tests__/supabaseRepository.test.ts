import { describe, it, expect } from 'vitest';
import { rowToStored, storedToRow } from '../supabaseRepository';
import type { AnalysisReport, StoredReport } from '../types';

// Minimal AnalysisReport stub — full shape is large; cast via unknown is the
// pragmatic fixture path so the test focuses on row<->stored mapping logic.
const stubReport = { score: 72, url: 'https://pixelab.ch/' } as unknown as AnalysisReport;

const sampleStored: StoredReport = {
  id: 'pixelab-ch-a8x4',
  url: 'https://pixelab.ch/',
  lang: 'fr',
  score: 72,
  createdAt: 1746273600000, // 2025-05-03T12:00:00Z
  crawlMs: 18234,
  shareToken: null,
  shareExpiresAt: null,
  data: stubReport,
  ipHash: 'a'.repeat(64),
  country: 'CH',
  userAgent: 'Mozilla/5.0',
  referrer: 'https://google.com/',
};

describe('storedToRow', () => {
  it('maps snake_case columns and converts unix-ms to ISO', () => {
    const row = storedToRow(sampleStored);
    expect(row.id).toBe('pixelab-ch-a8x4');
    expect(row.created_at).toBe(new Date(1746273600000).toISOString());
    expect(row.ip_hash).toBe('a'.repeat(64));
    expect(row.country).toBe('CH');
    expect(row.user_agent).toBe('Mozilla/5.0');
    expect(row.share_expires_at).toBeNull();
  });

  it('handles share_token + share_expires_at when present', () => {
    const stored = { ...sampleStored, shareToken: 'abc123', shareExpiresAt: 1746360000000 };
    const row = storedToRow(stored);
    expect(row.share_token).toBe('abc123');
    expect(row.share_expires_at).toBe(new Date(1746360000000).toISOString());
  });

  it('serializes null geo_analysis + cwv when enrichment is absent', () => {
    const row = storedToRow(sampleStored);
    expect(row.geo_analysis).toBeNull();
    expect(row.cwv).toBeNull();
  });

  it('passes through geo_analysis + cwv payloads when enrichment is present', () => {
    const cwv = { coreWebVitals: null, cwvIssues: [], cwvScorePenalty: 0 };
    const geo = { score: 41 } as unknown;
    const stored = {
      ...sampleStored,
      geoAnalysis: geo as StoredReport['geoAnalysis'],
      cwv: cwv as StoredReport['cwv'],
    };
    const row = storedToRow(stored);
    expect(row.geo_analysis).toBe(geo);
    expect(row.cwv).toBe(cwv);
  });
});

describe('rowToStored', () => {
  it('maps camelCase fields and converts ISO timestamps to unix-ms', () => {
    const row = {
      id: 'pixelab-ch-a8x4',
      url: 'https://pixelab.ch/',
      lang: 'fr' as const,
      score: 72,
      created_at: '2025-05-03T12:00:00.000Z',
      crawl_ms: 18234,
      share_token: null,
      share_expires_at: null,
      data: { score: 72 },
      ip_hash: 'a'.repeat(64),
      country: 'CH',
      user_agent: 'Mozilla/5.0',
      referrer: 'https://google.com/',
      geo_analysis: null,
      cwv: null,
      keyword_suggestions: null,
    };
    const stored = rowToStored(row);
    expect(stored.id).toBe('pixelab-ch-a8x4');
    expect(stored.createdAt).toBe(1746273600000);
    expect(stored.ipHash).toBe('a'.repeat(64));
    expect(stored.country).toBe('CH');
  });

  it('preserves null share fields', () => {
    const row = {
      id: 'x', url: 'u', lang: 'fr' as const, score: 0,
      created_at: '2026-05-03T12:00:00.000Z',
      crawl_ms: 0, share_token: null, share_expires_at: null,
      data: {},
      ip_hash: null, country: null, user_agent: null, referrer: null,
      geo_analysis: null, cwv: null, keyword_suggestions: null,
    };
    const stored = rowToStored(row);
    expect(stored.shareToken).toBeNull();
    expect(stored.shareExpiresAt).toBeNull();
    expect(stored.ipHash).toBeNull();
    expect(stored.geoAnalysis).toBeNull();
    expect(stored.cwv).toBeNull();
  });

  it('passes through geo_analysis + cwv when present in the row', () => {
    const geo = { score: 41 };
    const cwv = { coreWebVitals: null, cwvIssues: [], cwvScorePenalty: 0 };
    const row = {
      id: 'x', url: 'u', lang: 'fr' as const, score: 0,
      created_at: '2026-05-03T12:00:00.000Z',
      crawl_ms: 0, share_token: null, share_expires_at: null,
      data: {},
      ip_hash: null, country: null, user_agent: null, referrer: null,
      geo_analysis: geo, cwv, keyword_suggestions: null,
    };
    const stored = rowToStored(row);
    expect(stored.geoAnalysis).toEqual(geo);
    expect(stored.cwv).toEqual(cwv);
  });

  it('passes through keyword_suggestions when present (P18.B)', () => {
    const ks = { suggestions: [{ keyword: 'k', rationale: 'r' }], model: 'gemini-2.5-flash' };
    const row = {
      id: 'x', url: 'u', lang: 'fr' as const, score: 0,
      created_at: '2026-05-03T12:00:00.000Z',
      crawl_ms: 0, share_token: null, share_expires_at: null,
      data: {},
      ip_hash: null, country: null, user_agent: null, referrer: null,
      geo_analysis: null, cwv: null, keyword_suggestions: ks,
    };
    const stored = rowToStored(row);
    expect(stored.keywordSuggestions).toEqual(ks);
  });
});
