import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { suggestSeoKeywords, __test } from '../keyword-suggestions';

const { callGemini, callOpenAI, buildPrompt, normalizeSuggestions, languageName } = __test;

const originalFetch = global.fetch;
const originalGeminiKey = process.env.GEMINI_API_KEY;
const originalOpenAIKey = process.env.OPENAI_API_KEY;

const geminiResponse = (text: string) => ({
  candidates: [{ content: { parts: [{ text }] } }],
});

const openaiResponse = (content: string) => ({
  choices: [{ message: { content } }],
});

const geminiPayload = (suggestions: Array<{ keyword: string; rationale: string }>) =>
  geminiResponse(JSON.stringify({ suggestions }));

const openaiPayload = (suggestions: Array<{ keyword: string; rationale: string }>) =>
  openaiResponse(JSON.stringify({ suggestions }));

beforeEach(() => {
  global.fetch = vi.fn();
  delete process.env.GEMINI_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

afterEach(() => {
  global.fetch = originalFetch;
  if (originalGeminiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalGeminiKey;
  if (originalOpenAIKey === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = originalOpenAIKey;
  vi.restoreAllMocks();
});

/* --------------- languageName --------------- */

describe('languageName', () => {
  it('detects FR / EN / DE / IT including locale variants', () => {
    expect(languageName('fr')).toBe('French');
    expect(languageName('fr-CH')).toBe('French');
    expect(languageName('en-US')).toBe('English');
    expect(languageName('de-DE')).toBe('German');
    expect(languageName('it')).toBe('Italian');
  });
  it('falls back to French for unknown lang codes', () => {
    expect(languageName('zz')).toBe('French');
    expect(languageName('')).toBe('French');
  });
});

/* --------------- buildPrompt --------------- */

describe('buildPrompt', () => {
  it('forces rationale in the page language (FR)', () => {
    const p = buildPrompt({ url: 'https://x', lang: 'fr' });
    expect(p).toContain('Page language: French');
    expect(p).toContain('IN THE PAGE LANGUAGE (French)');
    expect(p).toContain('rationale IN THE PAGE LANGUAGE (French)');
  });

  it('forces rationale in DE for a German page', () => {
    const p = buildPrompt({ url: 'https://x', lang: 'de' });
    expect(p).toContain('rationale IN THE PAGE LANGUAGE (German)');
  });

  it('injects Schema.org context block when found', () => {
    const p = buildPrompt({
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
    expect(p).toContain('Schema.org context');
    expect(p).toContain('Service X');
    expect(p).toContain('internet, fibre');
    expect(p).toContain('Wingo');
  });

  it('omits Schema.org context block when not found', () => {
    const p = buildPrompt({ url: 'https://x', lang: 'fr' });
    expect(p).not.toContain('Schema.org context');
  });
});

/* --------------- normalizeSuggestions --------------- */

describe('normalizeSuggestions', () => {
  it('caps suggestions at 3', () => {
    const out = normalizeSuggestions({
      suggestions: [
        { keyword: 'a', rationale: 'r1' },
        { keyword: 'b', rationale: 'r2' },
        { keyword: 'c', rationale: 'r3' },
        { keyword: 'd', rationale: 'r4' },
      ],
    });
    expect(out).toHaveLength(3);
  });
  it('filters empty keywords', () => {
    const out = normalizeSuggestions({
      suggestions: [
        { keyword: 'good', rationale: 'r' },
        { keyword: '', rationale: 'r' },
      ],
    });
    expect(out).toEqual([{ keyword: 'good', rationale: 'r' }]);
  });
  it('returns null for malformed shape', () => {
    expect(normalizeSuggestions(null)).toBeNull();
    expect(normalizeSuggestions({})).toBeNull();
    expect(normalizeSuggestions({ suggestions: 'nope' })).toBeNull();
    expect(normalizeSuggestions({ suggestions: [] })).toBeNull();
  });
  it('handles missing rationale gracefully', () => {
    const out = normalizeSuggestions({ suggestions: [{ keyword: 'k' }] });
    expect(out).toEqual([{ keyword: 'k', rationale: '' }]);
  });
});

/* --------------- callGemini --------------- */

describe('callGemini', () => {
  it('returns null when GEMINI_API_KEY missing — does not call fetch', async () => {
    const r = await callGemini({ url: 'https://x', lang: 'fr' });
    expect(r).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns 3 suggestions on happy path with model=gemini-2.5-flash', async () => {
    process.env.GEMINI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => geminiPayload([
        { keyword: 'abonnement internet suisse', rationale: 'Cible commerciale forte' },
        { keyword: 'forfait mobile suisse', rationale: 'Volume de recherche élevé' },
        { keyword: 'fibre illimitée', rationale: 'Différenciateur produit clé' },
      ]),
    });
    const r = await callGemini({ url: 'https://x', lang: 'fr', title: 'T' });
    expect(r).not.toBeNull();
    expect(r!.model).toBe('gemini-2.5-flash');
    expect(r!.suggestions).toHaveLength(3);
    expect(r!.suggestions[0].keyword).toBe('abonnement internet suisse');
  });

  it('hits the v1beta endpoint with responseMimeType=json', async () => {
    process.env.GEMINI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => geminiPayload([{ keyword: 'k', rationale: 'r' }]),
    });
    await callGemini({ url: 'https://x', lang: 'fr' });
    const [calledUrl, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledUrl).toContain('generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent');
    expect(calledUrl).toContain('key=TEST');
    const body = JSON.parse(init.body as string);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.maxOutputTokens).toBe(320);
  });

  it('returns null + logs body on HTTP 400 (the bug we are diagnosing)', async () => {
    process.env.GEMINI_API_KEY = 'TEST';
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => '{"error":{"message":"Invalid model name"}}',
    });
    const r = await callGemini({ url: 'https://x', lang: 'fr' });
    expect(r).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    const logged = errSpy.mock.calls[0].join(' ');
    expect(logged).toContain('Gemini 400');
    expect(logged).toContain('Invalid model name');
  });

  it('returns null on non-JSON content', async () => {
    process.env.GEMINI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => geminiResponse('not json'),
    });
    const r = await callGemini({ url: 'https://x', lang: 'fr' });
    expect(r).toBeNull();
  });

  it('returns null when suggestions array is empty', async () => {
    process.env.GEMINI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => geminiPayload([]),
    });
    const r = await callGemini({ url: 'https://x', lang: 'fr' });
    expect(r).toBeNull();
  });
});

/* --------------- callOpenAI --------------- */

describe('callOpenAI', () => {
  it('returns null when OPENAI_API_KEY missing — does not call fetch', async () => {
    const r = await callOpenAI({ url: 'https://x', lang: 'fr' });
    expect(r).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it('returns 3 suggestions with model=gpt-4o-mini', async () => {
    process.env.OPENAI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => openaiPayload([{ keyword: 'k', rationale: 'r' }]),
    });
    const r = await callOpenAI({ url: 'https://x', lang: 'fr' });
    expect(r!.model).toBe('gpt-4o-mini');
    expect(r!.suggestions[0].keyword).toBe('k');
  });
  it('returns null on HTTP 429', async () => {
    process.env.OPENAI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false, status: 429, text: async () => 'rate limited',
    });
    const r = await callOpenAI({ url: 'https://x', lang: 'fr' });
    expect(r).toBeNull();
  });
});

/* --------------- suggestSeoKeywords (orchestrator) --------------- */

describe('suggestSeoKeywords (orchestrator)', () => {
  it('uses Gemini when both keys are set', async () => {
    process.env.GEMINI_API_KEY = 'GEM';
    process.env.OPENAI_API_KEY = 'OAI';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => geminiPayload([{ keyword: 'gem-kw', rationale: 'r' }]),
    });
    const r = await suggestSeoKeywords({ url: 'https://x', lang: 'fr' });
    expect(r!.model).toBe('gemini-2.5-flash');
    expect(r!.suggestions[0].keyword).toBe('gem-kw');
    expect(global.fetch).toHaveBeenCalledTimes(1); // only Gemini, no fallback
  });

  it('falls back to OpenAI when Gemini fails', async () => {
    process.env.GEMINI_API_KEY = 'GEM';
    process.env.OPENAI_API_KEY = 'OAI';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let call = 0;
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(async (url: string) => {
      call++;
      if (url.includes('googleapis.com')) {
        return { ok: false, status: 400, text: async () => 'gemini broke' } as Response;
      }
      return { ok: true, json: async () => openaiPayload([{ keyword: 'oai-kw', rationale: 'r' }]) } as Response;
    });
    const r = await suggestSeoKeywords({ url: 'https://x', lang: 'fr' });
    expect(r!.model).toBe('gpt-4o-mini');
    expect(r!.suggestions[0].keyword).toBe('oai-kw');
    expect(call).toBe(2); // tried both
  });

  it('skips Gemini entirely when key missing, calls OpenAI directly', async () => {
    process.env.OPENAI_API_KEY = 'OAI';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => openaiPayload([{ keyword: 'k', rationale: 'r' }]),
    });
    const r = await suggestSeoKeywords({ url: 'https://x', lang: 'fr' });
    expect(r!.model).toBe('gpt-4o-mini');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('returns null when both keys missing', async () => {
    const r = await suggestSeoKeywords({ url: 'https://x', lang: 'fr' });
    expect(r).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns null when Gemini fails AND OpenAI key missing', async () => {
    process.env.GEMINI_API_KEY = 'GEM';
    vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false, status: 400, text: async () => 'broke',
    });
    const r = await suggestSeoKeywords({ url: 'https://x', lang: 'fr' });
    expect(r).toBeNull();
    expect(global.fetch).toHaveBeenCalledTimes(1); // only Gemini, no OpenAI fallback
  });
});
