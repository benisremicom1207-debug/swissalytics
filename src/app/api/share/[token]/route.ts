import { NextResponse } from 'next/server';
import { getReportsRepo } from '@/lib/engine/repositoryInstance';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const repo = getReportsRepo();
  const stored = await repo.getByShareToken(token);
  if (!stored) {
    return NextResponse.json(
      { error: 'Lien partagé introuvable ou expiré' },
      { status: 404 },
    );
  }
  return NextResponse.json({
    reportId: stored.id,
    report: stored.data,
    expiresAt: stored.shareExpiresAt
      ? new Date(stored.shareExpiresAt).toISOString()
      : null,
  });
}
