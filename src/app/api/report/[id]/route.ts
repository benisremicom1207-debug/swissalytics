import { NextResponse } from 'next/server';
import { getReportsRepo } from '@/lib/engine/repositoryInstance';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const repo = getReportsRepo();
  const stored = await repo.getById(id);
  if (!stored) {
    return NextResponse.json({ error: 'Rapport introuvable' }, { status: 404 });
  }
  return NextResponse.json({
    reportId: stored.id,
    report: stored.data,
  });
}
