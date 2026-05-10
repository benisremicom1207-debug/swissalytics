import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fetchPageSpeed, _clearPageSpeedCache } from '../client';

/**
 * Unified PageSpeed client (P7.5) — pin the cache + fallback
 * behavior so a regression doesn't quietly double the Google API
 * billable calls.
 */

const mockResponse = {
  lighthouseResult: {
    categories: {
      performance:    { score: 0.85 },
      accessibility:  { score: 0.90 },
      'best-practices': { score: 0.75 },
      seo:            { score: 0.95 },
    },
    audits: {
      'first-contentful-paint':   { numericValue: 1200 },
      'largest-contentful-paint': { numericValue: 2400 },
      'cumulative-layout-shift':  { numericValue: 0.05 },
      'total-blocking-time':      { numericValue: 150 },
      'speed-index':              { numericValue: 2800 },
      interactive:                { numericValue: 3200 },
    },
  },
};

const originalFetch = global.fetch;
const originalApiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

beforeEach(() => {
  _clearPageSpeedCache();
  process.env.GOOGLE_PAGESPEED_API_KEY = 'TEST_API_KEY';
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => mockResponse,
    text: async () => '',
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.GOOGLE_PAGESPEED_API_KEY;
  else process.env.GOOGLE_PAGESPEED_API_KEY = originalApiKey;
  vi.restoreAllMocks();
});

describe('fetchPageSpeed — happy path', () => {
  it('returns aggregated 0..100 scores + detailed metrics', async () => {
    const result = await fetchPageSpeed('https://example.com', 'mobile');
    expect(result).not.toBeNull();
    expect(result!.performance).toBe(85);
    expect(result!.accessibility).toBe(90);
    expect(result!.bestPractices).toBe(75);
    expect(result!.seo).toBe(95);
    expect(result!.metrics.fcp).toBe(1200);
    expect(result!.metrics.lcp).toBe(2400);
    expect(result!.metrics.cls).toBe(0.05);
    expect(result!.metrics.tbt).toBe(150);
    expect(result!.metrics.si).toBe(2800);
    expect(result!.metrics.tti).toBe(3200);
  });

  it('passes the strategy and key in the API URL', async () => {
    await fetchPageSpeed('https://example.com/foo', 'desktop');
    const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain('url=https%3A%2F%2Fexample.com%2Ffoo');
    expect(calledUrl).toContain('strategy=desktop');
    expect(calledUrl).toContain('key=TEST_API_KEY');
    expect(calledUrl).toContain('category=performance');
    expect(calledUrl).toContain('category=accessibility');
    expect(calledUrl).toContain('category=best-practices');
    expect(calledUrl).toContain('category=seo');
  });
});

describe('fetchPageSpeed — caching', () => {
  it('serves second call from cache (no extra fetch)', async () => {
    await fetchPageSpeed('https://example.com', 'mobile');
    await fetchPageSpeed('https://example.com', 'mobile');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('separate cache entries per (url, strategy)', async () => {
    await fetchPageSpeed('https://example.com', 'mobile');
    await fetchPageSpeed('https://example.com', 'desktop');
    await fetchPageSpeed('https://example.com', 'mobile'); // cached
    await fetchPageSpeed('https://example.com', 'desktop'); // cached
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('different URLs do not share cache', async () => {
    await fetchPageSpeed('https://a.com', 'mobile');
    await fetchPageSpeed('https://b.com', 'mobile');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('returns identical result object across cache hits', async () => {
    const r1 = await fetchPageSpeed('https://example.com', 'mobile');
    const r2 = await fetchPageSpeed('https://example.com', 'mobile');
    expect(r1).toEqual(r2);
  });
});

describe('fetchPageSpeed — fallback / error handling', () => {
  it('returns null when no API key is configured', async () => {
    delete process.env.GOOGLE_PAGESPEED_API_KEY;
    const result = await fetchPageSpeed('https://example.com');
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns null on non-OK HTTP response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'rate limit',
    });
    const result = await fetchPageSpeed('https://example.com');
    expect(result).toBeNull();
  });

  it('returns null on malformed response (missing lighthouseResult)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const result = await fetchPageSpeed('https://example.com');
    expect(result).toBeNull();
  });

  it('returns null on network error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('connection reset'));
    const result = await fetchPageSpeed('https://example.com');
    expect(result).toBeNull();
  });

  it('does NOT cache failed responses (so retry can succeed)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'down' });
    const r1 = await fetchPageSpeed('https://example.com');
    expect(r1).toBeNull();

    // Recover on retry
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true, json: async () => mockResponse });
    const r2 = await fetchPageSpeed('https://example.com');
    expect(r2).not.toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
