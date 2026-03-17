import { NextRequest, NextResponse } from 'next/server';
import { analyzePage } from '@/lib/analyzer';
import { validateUrl, analyzeRateLimiter } from '@/lib/security';

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

    const result = await Promise.race([
      analyzePage(validatedUrl),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout: analyse trop longue (20s)')), 20000)
      ),
    ]);

    return NextResponse.json(result, { headers: CORS });
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : 'Erreur inattendue';
    console.error('[/api/analyze]', rawMessage);
    const isTimeout = rawMessage.includes('Timeout');
    return NextResponse.json(
      { error: isTimeout ? 'Délai d\'attente dépassé — le site ne répond pas.' : 'Une erreur est survenue lors de l\'analyse. Veuillez réessayer.' },
      { status: isTimeout ? 504 : 500, headers: CORS }
    );
  }
}
