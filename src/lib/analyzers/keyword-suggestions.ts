/**
 * LLM-based SEO keyword suggestions (P14.D).
 *
 * Statistical extraction (`analyzeKeywords` + Schema.org-first) tells
 * us WHAT'S ON the page. This module asks an LLM "what 3 SEO keywords
 * SHOULD this page target?" — bridging the gap between description
 * and prescription.
 *
 * Designed for gpt-4o-mini : ~$0.0002 per call (input ~500 tok,
 * output ~150 tok). Falls back to `null` on missing key / failure
 * (the UI then hides the section gracefully).
 */

import type { SchemaKeywords } from '@/lib/analyzer/schema-keywords';

export interface KeywordSuggestion {
  /** The recommended SEO keyword/phrase (mid-tail, 2-4 words typically). */
  keyword: string;
  /** Short rationale (~12-20 words) explaining why this keyword fits. */
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

const MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 12_000;
const MAX_OUTPUT_TOKENS = 320;

function buildPrompt(input: SuggestInput): string {
  const lang = input.lang.toLowerCase().startsWith('en') ? 'English' : input.lang.toLowerCase().startsWith('de') ? 'German' : input.lang.toLowerCase().startsWith('it') ? 'Italian' : 'French';

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
    ``,
    `Return ONLY valid JSON, no prose, no markdown:`,
    `{"suggestions": [`,
    `  {"keyword": "...", "rationale": "..."},`,
    `  {"keyword": "...", "rationale": "..."},`,
    `  {"keyword": "...", "rationale": "..."}`,
    `]}`,
    `Each rationale: max 20 words, in English.`,
  ].join('\n');
}

/**
 * Call gpt-4o-mini and return suggestions. Returns null when:
 *   - OPENAI_API_KEY is not set
 *   - HTTP error / timeout
 *   - Response can't be parsed as the expected shape
 */
export async function suggestSeoKeywords(input: SuggestInput): Promise<KeywordSuggestionsResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are an SEO consultant. Always respond with valid JSON only.' },
      { role: 'user', content: buildPrompt(input) },
    ],
    response_format: { type: 'json_object' as const },
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.4, // some variety, but stable
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
    if (!Array.isArray(parsed?.suggestions)) {
      throw new Error('Invalid suggestions shape (expected suggestions array)');
    }

    const suggestions: KeywordSuggestion[] = parsed.suggestions
      .slice(0, 3)
      .filter((s: unknown): s is { keyword: unknown; rationale: unknown } =>
        typeof s === 'object' && s !== null && 'keyword' in s)
      .map((s: { keyword: unknown; rationale?: unknown }) => ({
        keyword: String(s.keyword).trim(),
        rationale: typeof s.rationale === 'string' ? s.rationale.trim() : '',
      }))
      .filter((s: KeywordSuggestion) => s.keyword.length > 0);

    if (suggestions.length === 0) return null;

    return { suggestions, model: MODEL };
  } catch (err) {
    console.error('[KeywordSuggestions] failed:', err instanceof Error ? err.message : err);
    return null;
  }
}
