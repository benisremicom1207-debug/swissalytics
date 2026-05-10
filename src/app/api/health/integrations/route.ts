/**
 * GET /api/health/integrations
 *
 * Pings every external integration with a real call and returns
 * `{ provider: { status, latencyMs, message? } }` plus an aggregate
 * verdict. Used post-deploy to detect stale/invalid API keys in
 * seconds, instead of waiting for users to hit the broken feature.
 *
 * HTTP status:
 *   - 200 when overall === 'ok' (every configured provider answered)
 *   - 503 when overall === 'degraded' (at least one configured provider
 *     returned invalid_key / timeout / error)
 *
 * Missing keys do NOT trigger 503 — they're explicit "not configured"
 * states, surfaced as `status: 'missing_key'` in the per-provider block.
 */
import { NextResponse } from 'next/server';
import { checkAllIntegrations, computeOverallStatus } from '@/lib/integrations/health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  const integrations = await checkAllIntegrations();
  const overall = computeOverallStatus(integrations);
  return NextResponse.json(
    {
      status: overall,
      latencyMs: Date.now() - startedAt,
      integrations,
    },
    { status: overall === 'ok' ? 200 : 503 },
  );
}
