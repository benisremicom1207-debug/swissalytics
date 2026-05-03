import { NextResponse } from 'next/server';
import { getReportsRepo } from '@/lib/engine/repositoryInstance';

export const dynamic = 'force-dynamic'; // never cache

const HEALTH_TIMEOUT_MS = 3000;

export async function GET() {
  const startedAt = Date.now();
  let supabase: 'up' | 'down' = 'down';
  let detail: string | undefined;

  try {
    await Promise.race([
      getReportsRepo().listRecent(1),
      new Promise<never>((_, rej) =>
        setTimeout(
          () => rej(new Error(`timeout after ${HEALTH_TIMEOUT_MS}ms`)),
          HEALTH_TIMEOUT_MS,
        ),
      ),
    ]);
    supabase = 'up';
  } catch (err) {
    supabase = 'down';
    detail = err instanceof Error ? err.message : 'unknown error';
  }

  const ok = supabase === 'up';
  return NextResponse.json(
    {
      status: ok ? 'ok' : 'degraded',
      supabase,
      latencyMs: Date.now() - startedAt,
      detail,
    },
    { status: ok ? 200 : 503 },
  );
}
