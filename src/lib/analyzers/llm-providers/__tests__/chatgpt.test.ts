import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// See gemini.test.ts for why we mock registry here (circular import).
vi.mock('../registry', () => ({
  hasAPIKey: (envVar: string) => !!process.env[envVar],
}));

import { ChatGPTProvider } from '../chatgpt';

/**
 * The ChatGPT provider must call gpt-4o-mini, not gpt-4o. For the brand-
 * recognition prompt the small model gives equivalent answers at ~1/50th
 * the cost — critical for a free public tool. This test pins the model
 * name so a careless edit doesn't silently 50× the OpenAI bill.
 */

const fetchSpy = vi.fn<typeof fetch>();
const originalFetch = global.fetch;

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'test-key';
  global.fetch = fetchSpy as unknown as typeof fetch;
  fetchSpy.mockReset();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.OPENAI_API_KEY;
});

function mockResponse(body: unknown) {
  fetchSpy.mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
}

describe('ChatGPTProvider.testIndexation', () => {
  it('calls gpt-4o-mini, not the more expensive gpt-4o', async () => {
    mockResponse({ choices: [{ message: { content: 'no info' } }] });
    await new ChatGPTProvider().testIndexation('pixelab', 'pixelab.ch');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.model).not.toBe('gpt-4o');
  });

  it('hits the chat completions endpoint with bearer auth', async () => {
    mockResponse({ choices: [{ message: { content: 'no info' } }] });
    await new ChatGPTProvider().testIndexation('pixelab', 'pixelab.ch');

    const url = fetchSpy.mock.calls[0][0] as string;
    const init = fetchSpy.mock.calls[0][1]!;
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-key');
  });

  it('returns high confidence when domain + brand appear ≥2 times', async () => {
    mockResponse({
      choices: [{ message: { content: 'pixelab is a Swiss design agency. Their site pixelab.ch shows that pixelab does product UI.' } }],
    });
    const result = await new ChatGPTProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.indexed).toBe(true);
    expect(result.confidence).toBe('high');
    expect(result.mentions).toBeGreaterThanOrEqual(2);
  });

  it('returns error metadata when the API returns 401 (bad key or out of credit)', async () => {
    fetchSpy.mockResolvedValue(new Response('unauthorized', { status: 401, statusText: 'Unauthorized' }));
    const result = await new ChatGPTProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.indexed).toBe(false);
    expect(result.metadata?.error).toContain('401');
  });

  it('returns error metadata when the API key is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await new ChatGPTProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.metadata?.error).toBe('API key manquante');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
