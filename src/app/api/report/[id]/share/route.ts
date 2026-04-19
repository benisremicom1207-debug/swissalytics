import { NextResponse } from 'next/server';
import { newShareToken } from '@/lib/engine/ids';
import {
  getReportsRepo,
  SHARE_TOKEN_TTL_MS,
} from '@/lib/engine/repositoryInstance';

/**
 * POST /api/report/[id]/share  → mint or rotate a share token.
 * DELETE /api/report/[id]/share → revoke the current share token.
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

  const token = newShareToken();
  const expiresAt = Date.now() + SHARE_TOKEN_TTL_MS;
  const updated = await repo.setShareToken(id, token, expiresAt);
  if (!updated) {
    return NextResponse.json({ error: 'Rapport introuvable' }, { status: 404 });
  }

  return NextResponse.json({
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    shareUrl: `/s/${token}`,
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const repo = getReportsRepo();
  const updated = await repo.clearShareToken(id);
  if (!updated) {
    return NextResponse.json({ error: 'Rapport introuvable' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
