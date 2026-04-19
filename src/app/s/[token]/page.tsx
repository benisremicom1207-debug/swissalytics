'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import ReportView from '@/components/report/ReportView';
import { useTheme } from '@/components/design-system/ThemeProvider';
import type { AnalysisResult } from '@/lib/types';

interface ApiOk {
  reportId: string;
  report: AnalysisResult;
  expiresAt: string | null;
}

export default function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { lang } = useTheme();
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'ok'; report: AnalysisResult; expiresAt: string | null; reportId: string }
    | { kind: 'error'; status: number }
  >({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!alive) return;
        if (!res.ok) {
          setState({ kind: 'error', status: res.status });
          return;
        }
        const data: ApiOk = await res.json();
        setState({ kind: 'ok', report: data.report, expiresAt: data.expiresAt, reportId: data.reportId });
      } catch {
        if (alive) setState({ kind: 'error', status: 0 });
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <Shell>
      {state.kind === 'loading' && (
        <div className="mono" style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 24px', textAlign: 'center', color: 'var(--sa-ink-4)', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {lang === 'fr' ? 'Chargement…' : 'Loading…'}
        </div>
      )}

      {state.kind === 'error' && (
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '96px 24px' }}>
          <div className="mono caption-red" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 20 }}>
            § {state.status === 404 ? (lang === 'fr' ? '404 — Lien expiré' : '404 — Link expired') : (lang === 'fr' ? 'Erreur' : 'Error')}
          </div>
          <h1 className="display" style={{ fontSize: 'clamp(44px, 6vw, 96px)', letterSpacing: '-0.035em', lineHeight: 0.94, color: 'var(--sa-ink)', margin: '0 0 24px 0' }}>
            {state.status === 404
              ? (lang === 'fr' ? 'Ce lien n\u2019existe plus.' : 'This link no longer exists.')
              : (lang === 'fr' ? 'Une erreur est survenue.' : 'An error occurred.')}
          </h1>
          <p style={{ fontSize: 18, color: 'var(--sa-ink-2)', lineHeight: 1.45, marginBottom: 32 }}>
            {state.status === 404
              ? (lang === 'fr' ? 'Le lien partagé a expiré ou été révoqué.' : 'The share link has expired or been revoked.')
              : (lang === 'fr' ? 'Réessayez plus tard.' : 'Please try again later.')}
          </p>
          <Link href="/" className="mono" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 24px', background: 'var(--sa-ink)', color: 'var(--sa-cream)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', border: '2px solid var(--sa-ink)' }}>
            {lang === 'fr' ? 'Analyser un site' : 'Analyze a site'} →
          </Link>
        </div>
      )}

      {state.kind === 'ok' && (
        <>
          {/* Share banner at top */}
          <div className="ink-b mono" style={{ background: 'var(--sa-ink)', color: 'var(--sa-cream)', padding: '10px 24px', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--sa-red)' }} />
              {lang === 'fr' ? 'Rapport partagé · Swissalytics' : 'Shared report · Swissalytics'}
            </span>
            <span style={{ opacity: 0.7 }}>
              {state.expiresAt
                ? (lang === 'fr'
                    ? `Expire le ${new Date(state.expiresAt).toLocaleDateString('fr-CH')}`
                    : `Expires ${new Date(state.expiresAt).toLocaleDateString('en-CH')}`)
                : (lang === 'fr' ? 'Sans expiration' : 'No expiration')}
            </span>
          </div>

          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px' }}>
            <ReportView report={state.report} reportId={state.reportId} readOnly />
          </div>
        </>
      )}
    </Shell>
  );
}
