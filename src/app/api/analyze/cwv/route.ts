import { NextRequest, NextResponse } from 'next/server';
import { fetchCoreWebVitals, applyCwvToTechnical } from '@/lib/analyzer/technical';
import { validateUrl } from '@/lib/security';
import { hasRecentAdmission, getClientIp } from '@/lib/security/rateLimit';

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
    // P7.3 — unified rate limit. CWV is a follow-up enrichment;
    // the IP must have called /api/analyze in the past hour.
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

    console.log('[/api/analyze/cwv] Fetching CWV (mobile+desktop) for:', validatedUrl);
    const [mobile, desktop] = await Promise.all([
      fetchCoreWebVitals(validatedUrl, 'mobile'),
      fetchCoreWebVitals(validatedUrl, 'desktop'),
    ]);
    console.log('[/api/analyze/cwv] Results — mobile:', mobile ? 'OK' : 'null', '| desktop:', desktop ? 'OK' : 'null');

    if (!mobile && !desktop) {
      return NextResponse.json(
        { coreWebVitals: null, cwvIssues: [], cwvScorePenalty: 0 },
        { headers: CORS }
      );
    }

    // Score based on mobile only (Google mobile-first indexing)
    const { cwvIssues, cwvScorePenalty } = mobile
      ? applyCwvToTechnical(mobile)
      : { cwvIssues: [] as { type: 'error' | 'warning' | 'info'; message: string }[], cwvScorePenalty: 0 };

    return NextResponse.json(
      {
        coreWebVitals: { mobile: mobile ?? null, desktop: desktop ?? null },
        cwvIssues,
        cwvScorePenalty,
      },
      { headers: CORS }
    );
  } catch (err) {
    console.error('[/api/analyze/cwv] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { coreWebVitals: null, cwvIssues: [], cwvScorePenalty: 0 },
      { headers: CORS }
    );
  }
}
