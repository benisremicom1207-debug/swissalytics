import { NextResponse } from 'next/server';
import { getReportsRepo } from '@/lib/engine/repositoryInstance';
import type { EnrichPatch } from '@/lib/engine/repository';
import type { CwvEnrichment } from '@/lib/engine/types';
import type { GeoAnalysisResult } from '@/lib/analyzers/types';

/**
 * PATCH /api/report/[id]/enrich  → persist async enrichment payloads.
 *
 * Body: { geoAnalysis?: GeoAnalysisResult, cwv?: CwvEnrichment }
 *
 * Called fire-and-forget from the homepage after /api/geo-analyze and
 * /api/analyze/cwv resolve, so /r/<id> and /s/<slug> can rehydrate the
 * full report later. Same trust boundary as /share — anyone with the id
 * can patch enrichment, which matches the existing model.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!isObject(body)) {
    return NextResponse.json({ error: 'Body must be an object' }, { status: 400 });
  }

  const patch: EnrichPatch = {};
  if ('geoAnalysis' in body) {
    if (!isObject(body.geoAnalysis)) {
      return NextResponse.json({ error: 'geoAnalysis must be an object' }, { status: 400 });
    }
    patch.geoAnalysis = body.geoAnalysis as unknown as GeoAnalysisResult;
  }
  if ('cwv' in body) {
    if (!isObject(body.cwv)) {
      return NextResponse.json({ error: 'cwv must be an object' }, { status: 400 });
    }
    patch.cwv = body.cwv as unknown as CwvEnrichment;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { error: 'At least one of { geoAnalysis, cwv } is required' },
      { status: 400 },
    );
  }

  const repo = getReportsRepo();
  const updated = await repo.enrich(id, patch);
  if (!updated) {
    return NextResponse.json({ error: 'Rapport introuvable' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
