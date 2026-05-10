import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { suggestSeoKeywords } from '../keyword-suggestions';

const originalFetch = global.fetch;
const originalKey = process.env.OPENAI_API_KEY;

const mockOpenAIResponse = (suggestions: Array<{ keyword: string; rationale: string }>) => ({
  choices: [
    {
      message: {
        content: JSON.stringify({ suggestions }),
      },
    },
  ],
});

beforeEach(() => {
  process.env.OPENAI_API_KEY = 'TEST_KEY';
  global.fetch = vi.fn();
});
afterEach(() => {
  global.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalKey;
  vi.restoreAllMocks();
});

describe('suggestSeoKeywords — happy path', () => {
  it('returns 3 suggestions for a French telco page', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockOpenAIResponse([
        { keyword: 'abonnement internet suisse', rationale: 'Mid-tail commercial intent for telco buyers' },
        { keyword: 'forfait mobile pas cher',     rationale: 'Price-anchored search query common in CH market' },
        { keyword: 'fibre illimitée wingo',       rationale: 'Brand + product category, high conversion intent' },
      ]),
    });
    const result = await suggestSeoKeywords({
      url: 'https://wingo.ch',
      lang: 'fr',
      title: 'Wingo — Internet & Mobile',
      h1: 'Internet et mobile dès 39.95',
      bodyExcerpt: 'Découvre nos abonnements internet suisse...',
    });
    expect(result).not.toBeNull();
    expect(result!.suggestions).toHaveLength(3);
    expect(result!.suggestions[0].keyword).toBe('abonnement internet suisse');
    expect(result!.model).toBe('gpt-4o-mini');
  });

  it('caps to 3 suggestions even when API returns more', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockOpenAIResponse([
        { keyword: 'a', rationale: 'r1' },
        { keyword: 'b', rationale: 'r2' },
        { keyword: 'c', rationale: 'r3' },
        { keyword: 'd', rationale: 'r4' },
        { keyword: 'e', rationale: 'r5' },
      ]),
    });
    const result = await suggestSeoKeywords({ url: 'https://x', lang: 'fr' });
    expect(result!.suggestions).toHaveLength(3);
  });

  it('passes Schema.org context into the prompt when found', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockOpenAIResponse([{ keyword: 'k', rationale: 'r' }]),
    });
    await suggestSeoKeywords({
      url: 'https://x', lang: 'fr',
      schemaKeywords: {
        found: true,
        canonicalName: 'Service X',
        canonicalDescription: 'Internet illimité',
        category: 'Telecom',
        keywords: ['internet', 'fibre'],
        sourceTypes: ['Service'],
        brand: 'Wingo',
      },
    });
    const calledBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    const userPrompt = calledBody.messages.find((m: { role: string }) => m.role === 'user').content as string;
    expect(userPrompt).toContain('Schema.org context');
    expect(userPrompt).toContain('Service X');
    expect(userPrompt).toContain('internet, fibre');
    expect(userPrompt).toContain('Wingo');
  });

  it('omits Schema.org context block when not found', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockOpenAIResponse([{ keyword: 'k', rationale: 'r' }]),
    });
    await suggestSeoKeywords({ url: 'https://x', lang: 'fr' });
    const calledBody = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    const userPrompt = calledBody.messages.find((m: { role: string }) => m.role === 'user').content as string;
    expect(userPrompt).not.toContain('Schema.org context');
  });

  it('translates lang code to language name in prompt', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockOpenAIResponse([{ keyword: 'k', rationale: 'r' }]),
    });
    await suggestSeoKeywords({ url: 'https://x', lang: 'de' });
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body as string);
    const prompt = body.messages.find((m: { role: string }) => m.role === 'user').content as string;
    expect(prompt).toContain('Page language: German');
    expect(prompt).toContain('IN THE PAGE LANGUAGE (German)');
  });
});

describe('suggestSeoKeywords — fallback / error', () => {
  it('returns null when OPENAI_API_KEY is missing', async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await suggestSeoKeywords({ url: 'https://x', lang: 'fr' });
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns null on HTTP error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => 'rate limited',
    });
    expect(await suggestSeoKeywords({ url: 'https://x', lang: 'fr' })).toBeNull();
  });

  it('returns null on network error', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('connection reset'));
    expect(await suggestSeoKeywords({ url: 'https://x', lang: 'fr' })).toBeNull();
  });

  it('returns null on non-JSON content', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'plain text not json' } }] }),
    });
    expect(await suggestSeoKeywords({ url: 'https://x', lang: 'fr' })).toBeNull();
  });

  it('returns null when suggestions array is missing', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"foo":"bar"}' } }] }),
    });
    expect(await suggestSeoKeywords({ url: 'https://x', lang: 'fr' })).toBeNull();
  });

  it('filters out malformed suggestion entries', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => mockOpenAIResponse([
        { keyword: 'good', rationale: 'r' },
        { keyword: '', rationale: 'r' }, // empty keyword filtered
      ]),
    });
    const result = await suggestSeoKeywords({ url: 'https://x', lang: 'fr' });
    expect(result!.suggestions).toHaveLength(1);
    expect(result!.suggestions[0].keyword).toBe('good');
  });
});
