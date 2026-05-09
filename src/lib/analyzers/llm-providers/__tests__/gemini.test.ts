import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Break the circular import: registry.ts eagerly instantiates every provider,
// including GeminiProvider, which requires gemini.ts — which itself imports
// from registry. Mocking registry to expose just the `hasAPIKey` helper lets
// gemini.ts load in isolation for testing.
vi.mock('../registry', () => ({
  hasAPIKey: (envVar: string) => !!process.env[envVar],
}));

import { GeminiProvider } from '../gemini';

/**
 * The Gemini provider must call the current free-tier model
 * (gemini-2.5-flash). Prior free-tier models all hit dead ends:
 *   - gemini-pro: deprecated 2024 → 404
 *   - gemini-1.5-flash: works but knowledge too narrow
 *   - gemini-2.0-flash: "no longer available to new users" → 404
 * This test pins the URL so we don't silently regress the model name.
 */

const fetchSpy = vi.fn<typeof fetch>();
const originalFetch = global.fetch;

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key';
  global.fetch = fetchSpy as unknown as typeof fetch;
  fetchSpy.mockReset();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.GEMINI_API_KEY;
});

function mockResponse(body: unknown) {
  fetchSpy.mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
}

describe('GeminiProvider.testIndexation', () => {
  it('calls gemini-2.5-flash (current free-tier default for new API keys)', async () => {
    mockResponse({ candidates: [{ content: { parts: [{ text: 'unknown brand' }] } }] });
    await new GeminiProvider().testIndexation('pixelab', 'pixelab.ch');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toContain('models/gemini-2.5-flash:generateContent');
    // Guard against regressing to deprecated/weaker free-tier models
    expect(url).not.toContain('gemini-pro:');
    expect(url).not.toContain('gemini-1.5-flash:');
    expect(url).not.toContain('gemini-2.0-flash:');
  });

  it('returns indexed=false when the brand is not mentioned', async () => {
    mockResponse({ candidates: [{ content: { parts: [{ text: 'I have no information about this' }] } }] });
    const result = await new GeminiProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.indexed).toBe(false);
    expect(result.confidence).toBe('none');
  });

  it('returns high confidence when both domain and brand appear ≥2 times', async () => {
    mockResponse({
      candidates: [{ content: { parts: [{ text: 'pixelab is a great agency. Visit pixelab.ch — pixelab does design work.' }] } }],
    });
    const result = await new GeminiProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.indexed).toBe(true);
    expect(result.confidence).toBe('high');
    expect(result.mentions).toBeGreaterThanOrEqual(2);
  });

  it('returns error metadata when the API returns non-2xx', async () => {
    fetchSpy.mockResolvedValue(new Response('not found', { status: 404, statusText: 'Not Found' }));
    const result = await new GeminiProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.indexed).toBe(false);
    expect(result.confidence).toBe('none');
    expect(result.metadata?.error).toContain('404');
  });

  it('returns error metadata when the API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await new GeminiProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.indexed).toBe(false);
    expect(result.metadata?.error).toBe('API key manquante');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
