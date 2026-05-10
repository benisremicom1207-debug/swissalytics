/**
 * POST /api/keyword-suggestions  (P18.B)
 *
 * Avant P18, suggestSeoKeywords était bundlé dans /api/geo-analyze
 * dont la latence est dominée par Lighthouse (35s) et les 4 LLMs GEO
 * (25s). Conséquence : les suggestions Gemini, prêtes en 5-10s,
 * attendaient 27s avant de s'afficher au user.
 *
 * Endpoint séparé qui :
 *   - prend `{ url, pageContext }` (même contrat que /api/geo-analyze)
 *   - répond uniquement avec `{ keywordSuggestions }`
 *   - fait 1 seul appel LLM (~5s typique avec Gemini)
 *
 * Le client le hit en parallèle de /api/geo-analyze : les suggestions
 * arrivent dès qu'elles sont prêtes, indépendamment des autres
 * analyzers, et l'UI peut afficher un skeleton pendant l'attente.
 *
 * Sécurité : même rate-limiting que /api/geo-analyze (vérification
 * hasRecentAdmission). Sans /api/analyze récent depuis l'IP, 429.
 */
import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '@/lib/security';
import { hasRecentAdmission, getClientIp } from '@/lib/security/rateLimit';
import { suggestSeoKeywords, type KeywordSuggestionsResult } from '@/lib/analyzers/keyword-suggestions';
import type { SchemaKeywords } from '@/lib/analyzer/schema-keywords';

const TIMEOUT_MS = 12_000;

const CORS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://swissalytics.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export interface KeywordSuggestionsResponse {
  keywordSuggestions: KeywordSuggestionsResult | null;
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (!hasRecentAdmission(clientIp)) {
      return NextResponse.json(
        { error: 'Aucune analyse récente détectée pour cette IP — lancez d\'abord une analyse via /api/analyze.' },
        { status: 429, headers: CORS }
      );
    }

    const body = await request.json();
    const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';
    const pageContext: {
      lang?: string;
      title?: string;
      metaDescription?: string;
      h1?: string;
      schemaKeywords?: SchemaKeywords;
    } | undefined = body?.pageContext ?? undefined;
    // P19 — UI language (FR/EN) of the Swissalytics user, separate from
    // the analyzed page's lang. Drives rationale language only.
    const uiLang: string | undefined = typeof body?.uiLang === 'string' ? body.uiLang : undefined;

    if (!rawUrl) {
      return NextResponse.json({ error: 'URL requise' }, { status: 400, headers: CORS });
    }

    let validatedUrl: string;
    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Protocole non supporté');
      }
      validatedUrl = parsed.href;
    } catch {
      return NextResponse.json({ error: 'URL invalide' }, { status: 422, headers: CORS });
    }

    try {
      await validateUrl(validatedUrl);
    } catch {
      return NextResponse.json({ error: 'URL non autorisée' }, { status: 403, headers: CORS });
    }

    // Run with our own timeout. Both the LLM library calls have their
    // own AbortSignal.timeout but we add a wall-clock deadline to be
    // safe and to match /api/geo-analyze semantics.
    const result = await Promise.race([
      suggestSeoKeywords({
        url: validatedUrl,
        lang: pageContext?.lang ?? 'fr',
        uiLang,
        title: pageContext?.title,
        metaDescription: pageContext?.metaDescription,
        h1: pageContext?.h1,
        schemaKeywords: pageContext?.schemaKeywords,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
    ]);

    const response: KeywordSuggestionsResponse = { keywordSuggestions: result ?? null };
    return NextResponse.json(response, { headers: CORS });
  } catch (err) {
    console.error('[/api/keyword-suggestions]', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la génération des suggestions.' },
      { status: 500, headers: CORS }
    );
  }
}
