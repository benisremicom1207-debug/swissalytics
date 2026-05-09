import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// See gemini.test.ts for why we mock registry here (circular import).
vi.mock('../registry', () => ({
  hasAPIKey: (envVar: string) => !!process.env[envVar],
}));

import { ClaudeProvider } from '../claude';

/**
 * Claude (Anthropic) speaks a different protocol than OpenAI:
 *   - Auth header is `x-api-key`, not `Authorization: Bearer`
 *   - Mandatory `anthropic-version: 2023-06-01` header
 *   - Body has top-level `system`, `max_tokens` is required
 *   - Response shape is `data.content[0].text`, not `data.choices[0].message.content`
 *
 * These tests pin all of that so a careless edit can't silently break Claude
 * by trying to use OpenAI conventions.
 */

const fetchSpy = vi.fn<typeof fetch>();
const originalFetch = global.fetch;

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = 'test-key';
  global.fetch = fetchSpy as unknown as typeof fetch;
  fetchSpy.mockReset();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.ANTHROPIC_API_KEY;
});

function mockResponse(body: unknown) {
  fetchSpy.mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
}

describe('ClaudeProvider.testIndexation', () => {
  it('calls claude-haiku-4-5 (cheapest current Claude)', async () => {
    mockResponse({ content: [{ type: 'text', text: 'no info' }] });
    await new ClaudeProvider().testIndexation('pixelab', 'pixelab.ch');

    expect(fetchSpy).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.model).toBe('claude-haiku-4-5');
    // Guard against accidental upgrade to expensive Sonnet/Opus tiers
    expect(body.model).not.toMatch(/sonnet|opus/);
  });

  it('uses x-api-key header (not Bearer auth) and the anthropic-version', async () => {
    mockResponse({ content: [{ type: 'text', text: 'no info' }] });
    await new ClaudeProvider().testIndexation('pixelab', 'pixelab.ch');

    const init = fetchSpy.mock.calls[0][1]!;
    const headers = init.headers as Record<string, string>;
    expect(headers['x-api-key']).toBe('test-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
    expect(headers['Authorization']).toBeUndefined();
  });

  it('hits the Anthropic Messages endpoint', async () => {
    mockResponse({ content: [{ type: 'text', text: 'no info' }] });
    await new ClaudeProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(fetchSpy.mock.calls[0][0]).toBe('https://api.anthropic.com/v1/messages');
  });

  it('parses content[0].text correctly and reports high confidence on multi-mention', async () => {
    mockResponse({
      content: [{ type: 'text', text: 'pixelab is a Swiss design agency. Visit pixelab.ch — pixelab does product UI.' }],
    });
    const result = await new ClaudeProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.indexed).toBe(true);
    expect(result.confidence).toBe('high');
    expect(result.mentions).toBeGreaterThanOrEqual(2);
  });

  it('returns error metadata when the API key is missing', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await new ClaudeProvider().testIndexation('pixelab', 'pixelab.ch');
    expect(result.metadata?.error).toBe('API key manquante');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
