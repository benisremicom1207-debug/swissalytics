/**
 * LLM-based SEO keyword suggestions (P14.D → P15 migration).
 *
 * Statistical extraction (`analyzeKeywords` + Schema.org-first) tells
 * us WHAT'S ON the page. This module asks an LLM "what 3 SEO keywords
 * SHOULD this page target?" — bridging the gap between description
 * and prescription.
 *
 * Provider strategy (P15): Gemini (gemini-2.5-flash) is the primary
 * provider — it's free-tier, already configured for the GEO indexation
 * stack, and runs ~$0/call. OpenAI (gpt-4o-mini) stays as a fallback
 * when GEMINI_API_KEY is missing or Gemini's call fails. Both produce
 * the same `KeywordSuggestionsResult` shape so the UI doesn't care
 * which one answered.
 *
 * Rationales are now localized: the prompt forces output IN the page
 * language (FR/EN/DE/IT). Previously rationales were always English,
 * which read awkward on a French page.
 */

import type { SchemaKeywords } from '@/lib/analyzer/schema-keywords';

export interface KeywordSuggestion {
  /** The recommended SEO keyword/phrase (mid-tail, 2-4 words typically). */
  keyword: string;
  /** Short rationale (~12-20 words) in the page language. */
  rationale: string;
}

export interface KeywordSuggestionsResult {
  suggestions: KeywordSuggestion[];
  /** Model id that produced the suggestions (debug + cost auditing). */
  model: string;
}

interface SuggestInput {
  url: string;
  lang: string;
  title?: string;
  metaDescription?: string;
  h1?: string;
  bodyExcerpt?: string;
  schemaKeywords?: SchemaKeywords;
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const OPENAI_MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 320;

/** Map a 2-letter lang code (or longer like "fr-CH") to a full language name. */
function languageName(lang: string): 'French' | 'English' | 'German' | 'Italian' {
  const lc = lang.toLowerCase();
  if (lc.startsWith('en')) return 'English';
  if (lc.startsWith('de')) return 'German';
  if (lc.startsWith('it')) return 'Italian';
  return 'French';
}

function buildPrompt(input: SuggestInput): string {
  const lang = languageName(input.lang);

  const schemaContext = input.schemaKeywords?.found
    ? [
        '',
        'Schema.org context (declared by the site):',
        input.schemaKeywords.canonicalName    && `- Canonical name: ${input.schemaKeywords.canonicalName}`,
        input.schemaKeywords.canonicalDescription && `- Description: ${input.schemaKeywords.canonicalDescription}`,
        input.schemaKeywords.category         && `- Category: ${input.schemaKeywords.category}`,
        input.schemaKeywords.brand            && `- Brand/provider: ${input.schemaKeywords.brand}`,
        input.schemaKeywords.keywords.length > 0 && `- Declared keywords: ${input.schemaKeywords.keywords.join(', ')}`,
      ].filter(Boolean).join('\n')
    : '';

  return [
    `You are a senior SEO consultant. Suggest 3 SEO keywords this page SHOULD target.`,
    ``,
    `URL: ${input.url}`,
    `Page language: ${lang}`,
    `Title: ${input.title ?? '(missing)'}`,
    `Meta description: ${input.metaDescription ?? '(missing)'}`,
    `H1: ${input.h1 ?? '(missing)'}`,
    `First 200 words of body: ${input.bodyExcerpt ?? '(empty)'}`,
    schemaContext,
    ``,
    `Rules for the suggestions:`,
    `- Mid-tail (2 to 4 words). Avoid single generic words like "internet" or "swiss".`,
    `- Match commercial / transactional intent (what users actually search to BUY or compare).`,
    `- Localize: if Swiss site, prefer "suisse"/"swiss" anchored variants like "abonnement internet suisse".`,
    `- Naturally phrased — must read like a real search query, not keyword stuffing.`,
    `- Write the suggestions IN THE PAGE LANGUAGE (${lang}).`,
    `- Write the rationale IN THE PAGE LANGUAGE (${lang}) too — never in another language.`,
    `- Each rationale: max 20 words. Concise, concrete, no marketing fluff.`,
    ``,
    `Return ONLY valid JSON, no prose, no markdown:`,
    `{"suggestions": [`,
    `  {"keyword": "...", "rationale": "..."},`,
    `  {"keyword": "...", "rationale": "..."},`,
    `  {"keyword": "...", "rationale": "..."}`,
    `]}`,
  ].join('\n');
}

/**
 * Normalize a parsed suggestions array into validated `KeywordSuggestion`s.
 * Filters out malformed entries, caps at 3, returns null if empty.
 */
function normalizeSuggestions(parsed: unknown): KeywordSuggestion[] | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const arr = (parsed as { suggestions?: unknown }).suggestions;
  if (!Array.isArray(arr)) return null;

  const out: KeywordSuggestion[] = arr
    .slice(0, 3)
    .filter((s: unknown): s is { keyword: unknown; rationale?: unknown } =>
      typeof s === 'object' && s !== null && 'keyword' in s)
    .map((s) => ({
      keyword: String(s.keyword).trim(),
      rationale: typeof s.rationale === 'string' ? s.rationale.trim() : '',
    }))
    .filter((s) => s.keyword.length > 0);

  return out.length > 0 ? out : null;
}

/**
 * Call Gemini API. Returns null on any failure (missing key, HTTP
 * error, malformed response). Logs the actual error body so we can
 * diagnose 400/403/404 in prod instead of guessing.
 */
async function callGemini(input: SuggestInput): Promise<KeywordSuggestionsResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = buildPrompt(input);
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          responseMimeType: 'application/json',
        },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof content !== 'string') throw new Error('No content in Gemini response');

    const parsed = JSON.parse(content);
    const suggestions = normalizeSuggestions(parsed);
    if (!suggestions) throw new Error('Invalid suggestions shape from Gemini');

    return { suggestions, model: GEMINI_MODEL };
  } catch (err) {
    console.error('[KeywordSuggestions/Gemini] failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Call OpenAI gpt-4o-mini. Used as a fallback when Gemini is missing
 * or fails, so we keep getting suggestions during a Gemini outage.
 */
async function callOpenAI(input: SuggestInput): Promise<KeywordSuggestionsResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: 'You are an SEO consultant. Always respond with valid JSON only.' },
      { role: 'user', content: buildPrompt(input) },
    ],
    response_format: { type: 'json_object' as const },
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.4,
  };

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('No content in OpenAI response');

    const parsed = JSON.parse(content);
    const suggestions = normalizeSuggestions(parsed);
    if (!suggestions) throw new Error('Invalid suggestions shape from OpenAI');

    return { suggestions, model: OPENAI_MODEL };
  } catch (err) {
    console.error('[KeywordSuggestions/OpenAI] failed:', err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Public entry point. Tries Gemini first (free), falls back to OpenAI
 * if Gemini is unavailable or errored. Returns null when both providers
 * are unavailable — the UI then hides the section gracefully.
 */
export async function suggestSeoKeywords(input: SuggestInput): Promise<KeywordSuggestionsResult | null> {
  const viaGemini = await callGemini(input);
  if (viaGemini) return viaGemini;

  return callOpenAI(input);
}

/* --------------- test-only exports --------------- */

export const __test = { callGemini, callOpenAI, buildPrompt, normalizeSuggestions, languageName };
