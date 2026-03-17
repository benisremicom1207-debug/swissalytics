import { NextRequest, NextResponse } from 'next/server';
import { validateUrl, analyzeRateLimiter } from '@/lib/security';
import { runLighthouseAudit } from '@/lib/analyzers/lighthouse';
import { analyzeSEO } from '@/lib/analyzers/seo';
import { analyzeGEOIndexation } from '@/lib/analyzers/geo-indexation';
import { analyzeSchemaOrgMultiPage } from '@/lib/analyzers/schema-org';
import { analyzeEEAT } from '@/lib/analyzers/eeat';
import { calculateCompositeScore } from '@/lib/analyzers/composite-score';
import type { AnalysisResult } from '@/components/geo-analyzer/types';

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
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (!analyzeRateLimiter.check(clientIp)) {
      return NextResponse.json(
        { error: 'Trop de requêtes — veuillez patienter avant de réessayer.' },
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

    // Run all 5 analyzers in parallel with 30s timeout
    const analysisPromise = (async () => {
      const [lighthouse, seo, geo, schema, eeat] = await Promise.all([
        runLighthouseAudit(validatedUrl),
        analyzeSEO(validatedUrl),
        analyzeGEOIndexation(validatedUrl),
        analyzeSchemaOrgMultiPage(validatedUrl),
        analyzeEEAT(validatedUrl),
      ]);

      const composite = calculateCompositeScore({ lighthouse, seo, geo, schema, eeat });

      const warnings: string[] = [];
      if (lighthouse.isEstimated) {
        warnings.push(lighthouse.warning || 'Scores Lighthouse estimés (pas de clé API Google PageSpeed)');
      }

      const result: AnalysisResult = {
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
      };

      return result;
    })();

    const result = await Promise.race([
      analysisPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: analyse trop longue (30s)')), 30000)
      ),
    ]);

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
