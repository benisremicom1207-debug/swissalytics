import { NextRequest, NextResponse } from 'next/server';
import { analyzePage } from '@/lib/analyzer';
import { validateUrl } from '@/lib/security';
import { checkRateLimit, getClientIp, RATE_LIMIT } from '@/lib/security/rateLimit';
import { newReportId } from '@/lib/engine/ids';
import { getReportsRepo, DEDUP_WINDOW_MS } from '@/lib/engine/repositoryInstance';
import { cacheGet, cacheSet } from '@/lib/engine/cache';
import type { AnalysisReport, Lang, StoredReport } from '@/lib/engine/types';

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
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error:
            "Trop de requêtes — vous avez atteint la limite d'analyses. Réessayez plus tard.",
          retryAfterSec: rl.retryAfterSec,
        },
        {
          status: 429,
          headers: {
            ...CORS,
            'Retry-After': String(rl.retryAfterSec),
            'X-RateLimit-Hourly-Remaining': String(rl.hourlyRemaining),
            'X-RateLimit-Daily-Remaining': String(rl.dailyRemaining),
            'X-RateLimit-Hourly': String(RATE_LIMIT.hourly),
            'X-RateLimit-Daily': String(RATE_LIMIT.daily),
          },
        },
      );
    }

    const body = await request.json();
    const rawUrl = typeof body?.url === 'string' ? body.url.trim() : '';
    const lang: Lang = body?.lang === 'en' ? 'en' : 'fr';

    if (!rawUrl) {
      return NextResponse.json({ error: 'URL requise' }, { status: 400, headers: CORS });
    }

    let canonicalUrl: string;
    try {
      const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Protocole non supporté');
      }
      canonicalUrl = parsed.href;
    } catch {
      return NextResponse.json({ error: 'URL invalide' }, { status: 422, headers: CORS });
    }

    try {
      await validateUrl(canonicalUrl);
    } catch {
      return NextResponse.json(
        { error: 'URL non autorisée (hôte privé ou bloqué)' },
        { status: 403, headers: CORS },
      );
    }

    const repo = getReportsRepo();

    // Cache-level dedup
    const cachedId = cacheGet(canonicalUrl, lang, DEDUP_WINDOW_MS);
    if (cachedId) {
      const stored = await repo.getById(cachedId);
      if (stored) {
        return NextResponse.json(
          { reportId: stored.id, report: stored.data, cached: true },
          { headers: CORS },
        );
      }
    }

    // Repo-level dedup
    const recent = await repo.findRecent(canonicalUrl, lang, DEDUP_WINDOW_MS);
    if (recent) {
      cacheSet(canonicalUrl, lang, recent.id);
      return NextResponse.json(
        { reportId: recent.id, report: recent.data, cached: true },
        { headers: CORS },
      );
    }

    // Crawl
    const startedAt = Date.now();
    const result = await Promise.race([
      analyzePage(canonicalUrl),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: analyse trop longue (20s)')), 20000),
      ),
    ]);
    const crawlMs = Date.now() - startedAt;

    const id = newReportId();
    const createdAt = Date.now();
    const report: AnalysisReport = {
      ...(result as AnalysisReport),
      id,
      createdAt: new Date(createdAt).toISOString(),
      lang,
      crawlMs,
    };
    const stored: StoredReport = {
      id,
      url: canonicalUrl,
      lang,
      score: report.score,
      createdAt,
      crawlMs,
      shareToken: null,
      shareExpiresAt: null,
      data: report,
    };
    await repo.save(stored);
    cacheSet(canonicalUrl, lang, id);

    return NextResponse.json(
      { reportId: id, report },
      {
        headers: {
          ...CORS,
          'X-RateLimit-Hourly-Remaining': String(rl.hourlyRemaining),
          'X-RateLimit-Daily-Remaining': String(rl.dailyRemaining),
        },
      },
    );
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'Erreur inattendue';
    console.error('[/api/analyze]', rawMessage);

    // 403/401 : site anti-bot (WAF Cloudflare, Akamai, etc.)
    if (/HTTP 40[13]/i.test(rawMessage)) {
      return NextResponse.json(
        {
          error:
            "Ce site bloque les analyses automatiques (pare-feu anti-bot). Swissalytics ne peut pas l'analyser — essayez un autre site.",
        },
        { status: 422, headers: CORS },
      );
    }

    // 404 : page inexistante
    if (/HTTP 404/i.test(rawMessage)) {
      return NextResponse.json(
        { error: "Page introuvable (HTTP 404) — vérifiez l'URL." },
        { status: 422, headers: CORS },
      );
    }

    // Autres HTTP 4xx/5xx retournés par la cible
    const httpMatch = rawMessage.match(/HTTP (\d{3})/i);
    if (httpMatch) {
      return NextResponse.json(
        { error: `Le site a répondu avec une erreur HTTP ${httpMatch[1]}. Impossible de l'analyser.` },
        { status: 422, headers: CORS },
      );
    }

    // DNS : domaine inexistant (typo, TLD invalide)
    if (/ENOTFOUND|getaddrinfo|dns/i.test(rawMessage)) {
      return NextResponse.json(
        { error: "Domaine introuvable — vérifiez l'orthographe de l'URL." },
        { status: 422, headers: CORS },
      );
    }

    // Connexion refusée / reset
    if (/ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENETUNREACH/i.test(rawMessage)) {
      return NextResponse.json(
        { error: 'Le site ne répond pas (connexion refusée ou injoignable).' },
        { status: 422, headers: CORS },
      );
    }

    // Certificat TLS invalide
    if (/CERT|SSL|TLS/i.test(rawMessage)) {
      return NextResponse.json(
        { error: 'Problème de certificat HTTPS sur le site cible.' },
        { status: 422, headers: CORS },
      );
    }

    // Taille de réponse trop importante
    if (/trop importante|too large/i.test(rawMessage)) {
      return NextResponse.json(
        { error: 'La page est trop volumineuse pour être analysée (> 10 MB).' },
        { status: 422, headers: CORS },
      );
    }

    // Trop de redirections
    if (/redirection/i.test(rawMessage)) {
      return NextResponse.json(
        { error: 'Trop de redirections — le site boucle sur lui-même.' },
        { status: 422, headers: CORS },
      );
    }

    // Timeout
    if (/Timeout|ETIMEDOUT/i.test(rawMessage)) {
      return NextResponse.json(
        { error: "Délai d'attente dépassé — le site met trop de temps à répondre (> 20s)." },
        { status: 504, headers: CORS },
      );
    }

    // Inattendu
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'analyse. Veuillez réessayer." },
      { status: 500, headers: CORS },
    );
  }
}
