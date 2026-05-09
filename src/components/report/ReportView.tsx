'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/components/design-system/ThemeProvider';
import { COPY } from '@/lib/i18n/copy';
import { scoreColor } from '@/components/design-system/primitives';
import { buildPlan, verdictOf } from '@/lib/engine/plan';
import type { AnalysisResult, Issue } from '@/lib/types';
import DegradedBanner from './DegradedBanner';
import { Gauge } from './Gauge';
import { Scorecard } from './Scorecard';
import { ShareButton } from './ShareButton';
import { OverviewContent } from './OverviewContent';
import { DetailsContent, type DetailsSectionKey } from './DetailsContent';
import { PlanContent } from './PlanContent';
import { GeoTabContent } from './GeoTabContent';

interface ReportViewProps {
  report: AnalysisResult;
  reportId?: string;
  readOnly?: boolean;
  cwvLoading?: boolean;
  degraded?: boolean;
}

type TabKey = 'overview' | 'details' | 'plan' | 'geo';

function truncateUrl(url: string, max = 48): string {
  if (!url) return '';
  if (url.length <= max) return url;
  return url.slice(0, max - 1) + '…';
}

function parseTab(v: string | null): TabKey {
  if (v === 'details' || v === 'plan' || v === 'geo') return v;
  return 'overview';
}

/**
 * Inline since the share button needs to sit inside the right slot of the
 * MetricStrip caption bar. Not reused elsewhere → no file split.
 */
function StripCaptionBar({
  left,
  right,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="ink-b mono"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '10px 24px',
        background: 'var(--sa-ink)',
        color: 'var(--sa-cream)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      <span style={{ whiteSpace: 'nowrap' }}>{left}</span>
      {right !== undefined && (
        <span style={{ opacity: 0.75, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {right}
        </span>
      )}
    </div>
  );
}

export default function ReportView({
  report,
  reportId,
  readOnly,
  cwvLoading,
  degraded = false,
}: ReportViewProps) {
  const { lang } = useTheme();
  const isFr = lang === 'fr';
  const copy = COPY[lang];
  const router = useRouter();
  const searchParams = useSearchParams();

  // All issues — used for totalIssues + overview top list
  const allIssues = useMemo(() => {
    return [
      ...report.headings.issues.map((i) => ({ ...i, category: 'Headings' })),
      ...report.images.issues.map((i) => ({ ...i, category: 'Images' })),
      ...report.links.issues.map((i) => ({ ...i, category: isFr ? 'Liens' : 'Links' })),
      ...report.technical.issues.map((i) => ({ ...i, category: isFr ? 'Technique' : 'Technical' })),
      ...report.metadata.issues.map((i) => ({ ...i, category: isFr ? 'Métadonnées' : 'Metadata' })),
      ...report.readability.issues.map((i) => ({ ...i, category: isFr ? 'Lisibilité' : 'Readability' })),
      ...report.keywords.issues.map((i) => ({ ...i, category: isFr ? 'Contenu' : 'Content' })),
    ] satisfies Array<Issue & { category: string }>;
  }, [report, isFr]);

  const totalIssues = useMemo(
    () => allIssues.filter((i) => i.type === 'error' || i.type === 'warning').length,
    [allIssues],
  );

  // Plan
  const plan = useMemo(() => buildPlan(report), [report]);
  const critItems = useMemo(() => plan.filter((p) => p.bucket === 'crit'), [plan]);
  const warnItems = useMemo(() => plan.filter((p) => p.bucket === 'warn'), [plan]);
  const infoItems = useMemo(() => plan.filter((p) => p.bucket === 'info'), [plan]);

  // Tabs + URL sync
  const [tab, setTab] = useState<TabKey>(() => parseTab(searchParams?.get('tab') ?? null));

  useEffect(() => {
    const v = parseTab(searchParams?.get('tab') ?? null);
    setTab(v);
    // We intentionally only sync on searchParams change (back/forward nav).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function changeTab(next: TabKey) {
    setTab(next);
    const sp = new URLSearchParams(searchParams?.toString() ?? '');
    if (next === 'overview') {
      sp.delete('tab');
    } else {
      sp.set('tab', next);
    }
    const qs = sp.toString();
    router.replace(qs ? `?${qs}` : '?', { scroll: false });
  }

  // Details section
  const [section, setSection] = useState<DetailsSectionKey>('headings');

  // Verdict
  const verdict = verdictOf(report.score);
  const verdictText = isFr
    ? verdict === 'clean'
      ? "Site excellent — prêt pour Google et l'IA."
      : verdict === 'mixed'
      ? 'Site correct, quelques ajustements à faire.'
      : 'Site à corriger — plusieurs problèmes critiques.'
    : verdict === 'clean'
    ? 'Excellent site — ready for Google and AI.'
    : verdict === 'mixed'
    ? 'Decent site, a few fixes to do.'
    : 'Site needs work — several critical issues.';

  const verdictState = isFr
    ? verdict === 'clean'
      ? 'EXCELLENT'
      : verdict === 'mixed'
      ? 'MOYEN'
      : 'À CORRIGER'
    : verdict === 'clean'
    ? 'EXCELLENT'
    : verdict === 'mixed'
    ? 'MIXED'
    : 'FAILING';

  const overallColor = scoreColor(report.score);

  // Scorecards
  const seoTechScore = report.technical.score;
  const contentScore = report.readability.score;
  // The IA-Ready scorecard reflects the GEO pillar specifically (indexation IA + Schema +
  // E-E-A-T), so we read geoAnalysis.geo.score — not globalScore (which mixes SEO in).
  // Returns null while geoAnalysis is still being fetched (async after main analyze) so the
  // Scorecard can render a loading state instead of a misleading 0.
  const aiReadyScore: number | null = report.geoAnalysis
    ? report.geoAnalysis.geo.score
    : null;
  const localScore = report.headings.score;

  const scorecardLabels = isFr
    ? ['SEO Technique', 'Contenu', 'IA-Ready', 'Visibilité locale']
    : ['Technical SEO', 'Content', 'AI-Ready', 'Local visibility'];

  // Section defs
  const sectionDefs: Array<{ key: DetailsSectionKey; num: string; label: string }> = [
    { key: 'headings', num: '01', label: isFr ? 'Structure sémantique' : 'Semantic structure' },
    { key: 'images', num: '02', label: isFr ? 'Images & médias' : 'Images & media' },
    { key: 'links', num: '03', label: isFr ? 'Liens & navigation' : 'Links & navigation' },
    { key: 'technical', num: '04', label: isFr ? 'Performance technique' : 'Technical performance' },
    { key: 'metadata', num: '05', label: isFr ? 'Métadonnées' : 'Metadata' },
    { key: 'readability', num: '06', label: isFr ? 'Lisibilité' : 'Readability' },
  ];

  const tabsMono = copy.tabsMono; // [OVERVIEW, DETAILS, ACTION PLAN, AI INDEXATION / GEO]
  const tabKeys: TabKey[] = ['overview', 'details', 'plan', 'geo'];

  const showShare = !!reportId && !readOnly;

  // Stat cards (overview)
  const headingsTotal =
    report.headings.h1.length +
    report.headings.h2.length +
    report.headings.h3.length +
    report.headings.h4.length +
    report.headings.h5.length +
    report.headings.h6.length;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px 80px' }}>
      {degraded && <DegradedBanner isFr={isFr} />}
      {/* 1. MetricStrip */}
      <div className="frame sa-rise" style={{ background: 'var(--sa-cream)', position: 'relative' }}>
        <StripCaptionBar
          left={
            <span>
              §01 — {isFr ? 'Score global' : 'Overall score'}
            </span>
          }
          right={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <span>{truncateUrl(report.url)}</span>
              {showShare && reportId && (
                <ShareButton reportId={reportId} isFr={isFr} />
              )}
            </span>
          }
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
          }}
        >
          {/* LEFT CELL — gauge + verdict block */}
          <div
            style={{
              padding: '40px 48px',
              borderRight: '2px solid var(--sa-ink)',
              display: 'flex',
              alignItems: 'center',
              gap: 32,
            }}
          >
            <Gauge score={report.score} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span
                className="mono caption-red"
                style={{
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  color: overallColor,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ color: overallColor }}>&#9679;</span>
                {verdictState}
              </span>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: 'var(--sa-ink)',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.25,
                }}
              >
                {isFr
                  ? `${totalIssues} problème${totalIssues !== 1 ? 's' : ''} à traiter`
                  : `${totalIssues} issue${totalIssues !== 1 ? 's' : ''} to address`}
              </div>
            </div>
          </div>

          {/* RIGHT CELL — 4 scorecards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <Scorecard num="02" label={scorecardLabels[0]} score={seoTechScore} isLast={false} />
            <Scorecard num="03" label={scorecardLabels[1]} score={contentScore} isLast={false} />
            <Scorecard num="04" label={scorecardLabels[2]} score={aiReadyScore} isLast={false} />
            <Scorecard num="05" label={scorecardLabels[3]} score={localScore} isLast={true} />
          </div>
        </div>
      </div>

      {/* 2. Verdict line */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--sa-rule)' }}>
        <p
          className="serif"
          style={{
            fontFamily: 'var(--sa-font-serif)',
            fontStyle: 'italic',
            fontSize: 'clamp(18px, 2vw, 24px)',
            lineHeight: 1.4,
            margin: 0,
            color: 'var(--sa-ink)',
            fontWeight: 500,
          }}
        >
          &laquo; {verdictText} &raquo;
        </p>
      </div>

      {/* 3. Tab bar */}
      <div
        role="tablist"
        className="mono"
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 40,
          borderBottom: '1px solid var(--sa-rule)',
          padding: '24px 24px 0',
          flexWrap: 'wrap',
        }}
      >
        {tabKeys.map((k, i) => {
          const active = tab === k;
          return (
            <button
              key={k}
              role="tab"
              aria-selected={active}
              onClick={() => changeTab(k)}
              className="mono"
              style={{
                appearance: 'none',
                background: 'transparent',
                border: 'none',
                padding: '10px 0',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: active ? 'var(--sa-ink)' : 'var(--sa-ink-4)',
                borderBottom: `2px solid ${active ? 'var(--sa-ink)' : 'transparent'}`,
                marginBottom: -1,
                cursor: 'pointer',
              }}
            >
              {tabsMono[i]}
            </button>
          );
        })}
      </div>

      {/* 4. Tab content */}
      <div style={{ paddingTop: 32 }}>
        {tab === 'overview' && (
          <OverviewContent
            report={report}
            headingsTotal={headingsTotal}
            allIssues={allIssues}
            isFr={isFr}
          />
        )}

        {tab === 'details' && (
          <DetailsContent
            report={report}
            cwvLoading={cwvLoading}
            section={section}
            setSection={setSection}
            sectionDefs={sectionDefs}
          />
        )}

        {tab === 'plan' && (
          <PlanContent
            copy={copy}
            critItems={critItems}
            warnItems={warnItems}
            infoItems={infoItems}
          />
        )}

        {tab === 'geo' && <GeoTabContent report={report} isFr={isFr} />}
      </div>
    </div>
  );
}
