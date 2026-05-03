import { NextResponse } from 'next/server';
import {
  getReportsRepo,
  SHARE_TOKEN_TTL_MS,
} from '@/lib/engine/repositoryInstance';

/**
 * POST /api/report/[id]/share  → enable sharing (sets 30d expiration).
 * DELETE /api/report/[id]/share → disable sharing.
 */

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const repo = getReportsRepo();

  const existing = await repo.getById(id);
  if (!existing) {
    return NextResponse.json({ error: 'Rapport introuvable' }, { status: 404 });
  }

  const expiresAt = Date.now() + SHARE_TOKEN_TTL_MS;
  const updated = await repo.enableSharing(id, expiresAt);
  if (!updated) {
    return NextResponse.json({ error: 'Rapport introuvable' }, { status: 404 });
  }

  return NextResponse.json({
    expiresAt: new Date(expiresAt).toISOString(),
    shareUrl: `/s/${id}`,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const repo = getReportsRepo();
  const updated = await repo.disableSharing(id);
  if (!updated) {
    return NextResponse.json({ error: 'Rapport introuvable' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
