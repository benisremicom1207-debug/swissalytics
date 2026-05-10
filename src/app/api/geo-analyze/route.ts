import { NextRequest, NextResponse } from 'next/server';
import { validateUrl } from '@/lib/security';
import { hasRecentAdmission, getClientIp } from '@/lib/security/rateLimit';
import { runLighthouseAudit } from '@/lib/analyzers/lighthouse';
import { analyzeSEO } from '@/lib/analyzers/seo';
import { analyzeGEOIndexation } from '@/lib/analyzers/geo-indexation';
import { analyzeSchemaOrgMultiPage } from '@/lib/analyzers/schema-org';
import { analyzeEEAT } from '@/lib/analyzers/eeat';
import { calculateCompositeScore } from '@/lib/analyzers/composite-score';
import {
  withTimeout,
  resolveOrFallback,
  lighthouseFallback,
  seoFallback,
  geoIndexationFallback,
  schemaOrgFallback,
  eeatFallback,
  isAnyDegraded,
  type DegradedFlags,
} from '@/lib/analyzers/resilience';
import type { GeoAnalysisResult } from '@/lib/analyzers/types';

/**
 * Per-analyzer timeouts (P8.2). Lighthouse calls Google PageSpeed (or
 * an internal estimator) which is the slowest step — give it 15s.
 * The other 4 analyzers are local cheerio + cheap fetches, 5s is
 * generous.
 */
const TIMEOUTS = {
  lighthouse: 15_000,
  seo: 5_000,
  geo: 5_000,
  schema: 5_000,
  eeat: 5_000,
} as const;

const CORS = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://swissalytics.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: NextRequest) {
  try {
    // P7.3 — unified rate limit. Enrichment endpoints don't consume
    // their own credits; they verify the IP has been admitted by a
    // recent /api/analyze call (within the past hour). Spammers
    // hitting /api/geo-analyze without a prior /api/analyze get 429.
    const clientIp = getClientIp(request);
    if (!hasRecentAdmission(clientIp)) {
      return NextResponse.json(
        { error: 'Aucune analyse récente détectée pour cette IP — lancez d\'abord une analyse via /api/analyze.' },
        { status: 429, headers: CORS }
      );
    }

    const body = await request.json();
    const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';

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

    // P8: Run all 5 analyzers in parallel with PER-ANALYZER timeouts
    // and fail-open via Promise.allSettled. A single rejection no
    // longer 500s the whole request — failed analyzers fall back to
    // safe defaults and the response carries a `degraded` flag block
    // so the UI can surface partial data clearly.
    const settled = await Promise.allSettled([
      withTimeout(runLighthouseAudit(validatedUrl),     TIMEOUTS.lighthouse, 'lighthouse'),
      withTimeout(analyzeSEO(validatedUrl),             TIMEOUTS.seo,        'seo'),
      withTimeout(analyzeGEOIndexation(validatedUrl),   TIMEOUTS.geo,        'geo'),
      withTimeout(analyzeSchemaOrgMultiPage(validatedUrl), TIMEOUTS.schema,  'schema'),
      withTimeout(analyzeEEAT(validatedUrl),            TIMEOUTS.eeat,       'eeat'),
    ]);

    const degraded: DegradedFlags = { lighthouse: false, seo: false, geo: false, schema: false, eeat: false };
    const degradedReasons: Record<keyof DegradedFlags, string | undefined> = {
      lighthouse: undefined, seo: undefined, geo: undefined, schema: undefined, eeat: undefined,
    };

    const lighthouse = resolveOrFallback(settled[0], () => lighthouseFallback(degradedReasons.lighthouse ?? 'erreur inconnue'),
      (r) => { degraded.lighthouse = true; degradedReasons.lighthouse = r; });
    const seo    = resolveOrFallback(settled[1], seoFallback,           (r) => { degraded.seo    = true; degradedReasons.seo = r; });
    const geo    = resolveOrFallback(settled[2], geoIndexationFallback, (r) => { degraded.geo    = true; degradedReasons.geo = r; });
    const schema = resolveOrFallback(settled[3], schemaOrgFallback,     (r) => { degraded.schema = true; degradedReasons.schema = r; });
    const eeat   = resolveOrFallback(settled[4], eeatFallback,          (r) => { degraded.eeat   = true; degradedReasons.eeat = r; });

    if (isAnyDegraded(degraded)) {
      console.warn('[/api/geo-analyze] Degraded:',
        Object.entries(degraded).filter(([, v]) => v).map(([k]) => `${k}=${degradedReasons[k as keyof DegradedFlags]}`).join(' · ')
      );
    }

    const composite = calculateCompositeScore({ lighthouse, seo, geo, schema, eeat });

    const warnings: string[] = [];
    if (lighthouse.isEstimated) {
      warnings.push(lighthouse.warning || 'Scores Lighthouse estimés (pas de clé API Google PageSpeed)');
    }
    for (const [name, reason] of Object.entries(degradedReasons)) {
      if (reason) warnings.push(`${name} indisponible : ${reason}`);
    }

    const result: GeoAnalysisResult = {
      url: validatedUrl,
      timestamp: new Date().toISOString(),
      globalScore: composite.globalScore,
      category: composite.category,
      seo: {
        score: composite.seo.score,
        breakdown: composite.seo.breakdown,
        lighthouse: {
          performance: lighthouse.performance,
          accessibility: lighthouse.accessibility,
          bestPractices: lighthouse.bestPractices,
          seo: lighthouse.seo,
          isEstimated: lighthouse.isEstimated,
          warning: lighthouse.warning,
        },
      },
      geo: {
        score: composite.geo.score,
        breakdown: composite.geo.breakdown,
        indexation: {
          score: geo.score,
          totalIndexed: geo.totalIndexed,
          totalEnabled: geo.totalEnabled,
          region: geo.region,
          engines: geo.engines,
        },
        schema: {
          score: schema.score,
          totalFound: schema.totalFound,
          schemas: schema.schemas,
        },
        eeat: {
          score: eeat.score,
          signals: {
            teamPage: { found: eeat.signals.teamPage.found },
            legalMentions: eeat.signals.legalMentions,
            contactPage: { found: eeat.signals.contactPage.found },
            testimonials: { found: eeat.signals.testimonials.found, count: eeat.signals.testimonials.count },
          },
        },
      },
      recommendations: composite.topRecommendations.map(r => ({
        ...r,
        timeframe: r.timeframe as string,
      })),
      projection: composite.projection,
      warnings: warnings.length > 0 ? warnings : undefined,
      degraded: isAnyDegraded(degraded) ? degraded : undefined,
    };

    return NextResponse.json(result, { headers: CORS });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'Erreur inattendue';
    console.error('[/api/geo-analyze]', rawMessage);
    const isTimeout = rawMessage.includes('Timeout');
    return NextResponse.json(
      { error: isTimeout ? 'Délai d\'attente dépassé — le site ne répond pas.' : 'Une erreur est survenue lors de l\'analyse. Veuillez réessayer.' },
      { status: isTimeout ? 504 : 500, headers: CORS }
    );
  }
}
