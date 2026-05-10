'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import ReportView from '@/components/report/ReportView';
import { useTheme } from '@/components/design-system/ThemeProvider';
import { fetchGeo, fetchCwv, persistEnrichment, buildPageContext } from '@/lib/client/enrichment';
import { calculateGlobalScore } from '@/lib/analyzer/score';
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

        // Conditional async enrichment — only fetches what's missing in
        // the stored report. Once persisted via PATCH /enrich, subsequent
        // loads of /r/<id> read the merged data straight from the DB.
        // This rescues old reports that pre-date the enrichment columns
        // or that crashed mid-run before geo/cwv could persist.
        const r = data.report;
        const cwvOk =
          r.technical?.coreWebVitals?.mobile ||
          r.technical?.coreWebVitals?.desktop;

        if (!r.geoAnalysis) {
          fetchGeo(r.url, buildPageContext(r)).then((geo) => {
            if (cancelled || !geo) return;
            setState((s) =>
              s.status === 'ok'
                ? { status: 'ok', report: { ...s.report, geoAnalysis: geo } }
                : s,
            );
            persistEnrichment(id, { geoAnalysis: geo });
          });
        }

        if (!cwvOk) {
          fetchCwv(r.url).then((cwv) => {
            if (cancelled || !cwv) return;
            setState((s) => {
              if (s.status !== 'ok') return s;
              const newTechScore = Math.max(
                0,
                s.report.technical.score - cwv.cwvScorePenalty,
              );
              const updatedTechnical = {
                ...s.report.technical,
                coreWebVitals: cwv.coreWebVitals,
                score: newTechScore,
                issues: [...s.report.technical.issues, ...cwv.cwvIssues],
              };
              const newGlobal = calculateGlobalScore({
                ...s.report,
                technical: updatedTechnical,
              });
              return {
                status: 'ok',
                report: { ...s.report, technical: updatedTechnical, score: newGlobal },
              };
            });
            persistEnrichment(id, { cwv });
          });
        }
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
