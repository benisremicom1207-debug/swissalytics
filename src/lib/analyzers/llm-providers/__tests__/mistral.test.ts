import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// See gemini.test.ts for why we mock registry here.
vi.mock('../registry', () => ({
  hasAPIKey: (envVar: string) => !!process.env[envVar],
}));

import { MistralProvider } from '../mistral';

/**
 * The Mistral provider must call a model available on the FREE tier.
 * mistral-large-latest is paid-only and returns 401/403 from a free key.
 * mistral-small-latest is the best free-tier option.
 */

const fetchSpy = vi.fn<typeof fetch>();
const originalFetch = global.fetch;

beforeEach(() => {
  process.env.MISTRAL_API_KEY = 'test-key';
  global.fetch = fetchSpy as unknown as typeof fetch;
  fetchSpy.mockReset();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.MISTRAL_API_KEY;
});

function mockResponse(body: unknown) {
  fetchSpy.mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
}

describe('MistralProvider.testIndexation', () => {
  it('calls mistral-small-latest (free tier), not the paid mistral-large-latest', async () => {
    mockResponse({ choices: [{ message: { content: 'no info' } }] });
    await new MistralProvider().testIndexation('pixelab', 'pixelab.ch');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.model).toBe('mistral-small-latest');
    expect(body.model).not.toBe('mistral-large-latest');
  });

  it('hits the OpenAI-compatible endpoint with bearer auth', async () => {
    mockResponse({ choices: [{ message: { content: 'no info' } }] });
    await new MistralProvider().testIndexation('pixelab', 'pixelab.ch');

    const url = fetchSpy.mock.calls[0][0] as string;
    const init = fetchSpy.mock.calls[0][1]!;
    expect(url).toBe('https://api.mistral.ai/v1/chat/completions');
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-key');
  });

  it('reports indexed=true with medium confidence when only the brand appears once', async () => {
    mockResponse({ choices: [{ message: { content: 'pixelab is an agency I have heard of.' } }] });
    const result = await new MistralProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.indexed).toBe(true);
    expect(result.confidence).toBe('medium');
    expect(result.mentions).toBe(1);
  });

  it('returns error metadata when the API returns 401 (paid-only model on free key)', async () => {
    fetchSpy.mockResolvedValue(new Response('unauthorized', { status: 401, statusText: 'Unauthorized' }));
    const result = await new MistralProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.indexed).toBe(false);
    expect(result.metadata?.error).toContain('401');
  });

  it('returns error metadata when the API key is missing', async () => {
    delete process.env.MISTRAL_API_KEY;
    const result = await new MistralProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.metadata?.error).toBe('API key manquante');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
