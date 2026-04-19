'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import ReportView from '@/components/report/ReportView';
import { useTheme } from '@/components/design-system/ThemeProvider';
import type { AnalysisResult } from '@/lib/types';

type FetchState =
  | { status: 'loading' }
  | { status: 'ok'; report: AnalysisResult }
  | { status: 'not-found' }
  | { status: 'error' };

export default function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { lang } = useTheme();
  const isFr = lang === 'fr';

  const [state, setState] = useState<FetchState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/report/${id}`);
        if (cancelled) return;
        if (res.status === 404) {
          setState({ status: 'not-found' });
          return;
        }
        if (!res.ok) {
          setState({ status: 'error' });
          return;
        }
        const data = (await res.json()) as { report: AnalysisResult };
        if (cancelled) return;
        if (!data?.report) {
          setState({ status: 'error' });
          return;
        }
        setState({ status: 'ok', report: data.report });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (state.status === 'loading') {
    return (
      <Shell>
        <div
          className="mono"
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-ink-4)',
          }}
        >
          {isFr ? 'Chargement…' : 'Loading…'}
        </div>
      </Shell>
    );
  }

  if (state.status === 'not-found') {
    return (
      <Shell>
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div
            className="mono caption-red"
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            § 404
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--sa-ink)',
              letterSpacing: '-0.01em',
            }}
          >
            {isFr ? 'Rapport introuvable' : 'Report not found'}
          </div>
          <Link
            href="/"
            className="mono"
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--sa-ink)',
              borderBottom: '1px solid var(--sa-ink)',
              paddingBottom: 2,
              textDecoration: 'none',
            }}
          >
            {isFr ? '← Retour à l’accueil' : '← Back to home'}
          </Link>
        </div>
      </Shell>
    );
  }

  if (state.status === 'error') {
    return (
      <Shell>
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <div
            className="mono caption-red"
            style={{
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            § Error
          </div>
          <div
            style={{
              fontSize: 18,
              color: 'var(--sa-ink-3)',
            }}
          >
            {isFr
              ? 'Impossible de charger ce rapport.'
              : 'Could not load this report.'}
          </div>
          <Link
            href="/"
            className="mono"
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--sa-ink)',
              borderBottom: '1px solid var(--sa-ink)',
              paddingBottom: 2,
              textDecoration: 'none',
            }}
          >
            {isFr ? '← Retour à l’accueil' : '← Back to home'}
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ReportView report={state.report} reportId={id} />
    </Shell>
  );
}
