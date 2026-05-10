import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchGeo, fetchCwv, persistEnrichment } from '../enrichment';

/**
 * enrichment.ts — pure async helpers used by both `page.tsx` (live
 * analysis) and `/r/[id]/page.tsx` (rehydration). The contract these
 * tests pin:
 *   - return null on any failure (HTTP error, network error, malformed)
 *   - return data on 2xx
 *   - persistEnrichment is fire-and-forget (no throw on failure)
 *   - cwv filters out empty-CWV responses (both null) — caller doesn't repeat
 */

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('fetchGeo', () => {
  it('returns geo data on 2xx response', async () => {
    const geo = { url: 'https://x', globalScore: 80 } as unknown;
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => geo,
    });
    const result = await fetchGeo('https://x');
    expect(result).toBe(geo);
  });

  it('returns null on non-OK status', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'rate limit' }),
    });
    const result = await fetchGeo('https://x');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fetch failed'));
    const result = await fetchGeo('https://x');
    expect(result).toBeNull();
  });

  it('returns null on malformed JSON', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => { throw new Error('invalid json'); },
    });
    const result = await fetchGeo('https://x');
    expect(result).toBeNull();
  });

  it('POSTs to /api/geo-analyze with the URL in the body', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    await fetchGeo('https://example.com/');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/geo-analyze',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com/' }),
      }),
    );
  });
});

describe('fetchCwv', () => {
  const validCwv = {
    coreWebVitals: { mobile: { performance: 80, fcp: 1, lcp: 2, cls: 0.05, tbt: 100, si: 1 }, desktop: null },
    cwvScorePenalty: 5,
    cwvIssues: [],
  };

  it('returns cwv data when at least one platform has metrics', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => validCwv,
    });
    const result = await fetchCwv('https://x');
    expect(result).toEqual(validCwv);
  });

  it('returns null when both mobile and desktop are null (no usable metrics)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        coreWebVitals: { mobile: null, desktop: null },
        cwvScorePenalty: 0,
        cwvIssues: [],
      }),
    });
    const result = await fetchCwv('https://x');
    expect(result).toBeNull();
  });

  it('returns null when coreWebVitals is missing entirely', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const result = await fetchCwv('https://x');
    expect(result).toBeNull();
  });

  it('returns null on HTTP error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    expect(await fetchCwv('https://x')).toBeNull();
  });

  it('returns null on network error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));
    expect(await fetchCwv('https://x')).toBeNull();
  });
});

describe('persistEnrichment', () => {
  it('PATCHes /api/report/<id>/enrich with the patch body', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    persistEnrichment('abc-123', { geoAnalysis: { score: 1 } });
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/report/abc-123/enrich',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ geoAnalysis: { score: 1 } }),
      }),
    );
  });

  it('does not throw on network error (fire-and-forget)', () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('down'));
    expect(() => persistEnrichment('abc-123', { cwv: {} })).not.toThrow();
  });
});
