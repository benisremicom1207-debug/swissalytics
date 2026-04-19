'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/components/design-system/ThemeProvider';
import { COPY } from '@/lib/i18n/copy';
import {
  DisplayTitle,
  scoreColor,
  scoreGrade,
} from '@/components/design-system/primitives';
import { buildPlan, verdictOf, type PlanItem } from '@/lib/engine/plan';
import type { AnalysisResult, Issue } from '@/lib/types';
import HeadingsTab from '../tabs/HeadingsTab';
import ImagesTab from '../tabs/ImagesTab';
import LinksTab from '../tabs/LinksTab';
import TechnicalTab from '../tabs/TechnicalTab';
import MetadataTab from '../tabs/MetadataTab';
import ReadabilityTab from '../tabs/ReadabilityTab';

/* ============================================================
   Types
   ============================================================ */

interface ReportViewProps {
  report: AnalysisResult;
  reportId?: string;
  readOnly?: boolean;
  cwvLoading?: boolean;
}

type TabKey = 'overview' | 'details' | 'plan';
type SectionKey =
  | 'headings'
  | 'images'
  | 'links'
  | 'technical'
  | 'metadata'
  | 'readability';

/* ============================================================
   Helpers
   ============================================================ */

function truncateUrl(url: string, max = 48): string {
  if (!url) return '';
  if (url.length <= max) return url;
  return url.slice(0, max - 1) + '…';
}

function parseTab(v: string | null): TabKey {
  if (v === 'details' || v === 'plan') return v;
  return 'overview';
}

/* ============================================================
   Gauge — pure inline SVG, no animation
   ============================================================ */

function Gauge({ score }: { score: number }) {
  const r = 80;
  const cx = 90;
  const cy = 90;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = scoreColor(score);
  const grade = scoreGrade(score);

  return (
    <div style={{ position: 'relative', width: 180, height: 180 }}>
      <svg
        width={180}
        height={180}
        viewBox="0 0 180 180"
        aria-hidden
        style={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="var(--sa-rule)"
          strokeWidth={6}
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="butt"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <span
          className="display tnum"
          style={{
            fontSize: 72,
            lineHeight: 1,
            color,
            letterSpacing: '-0.04em',
            fontWeight: 800,
          }}
        >
          {score}
        </span>
        <span
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-ink-4)',
            fontWeight: 700,
          }}
        >
          / 100 · {grade}
        </span>
      </div>
    </div>
  );
}

/* ============================================================
   Scorecard — 4 dimension cards in MetricStrip right cell
   ============================================================ */

function Scorecard({
  num,
  label,
  score,
  isLast,
}: {
  num: string;
  label: string;
  score: number;
  isLast: boolean;
}) {
  const color = scoreColor(score);
  return (
    <div
      style={{
        padding: '28px 24px',
        borderRight: isLast ? 'none' : '1px solid var(--sa-rule)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--sa-ink-4)',
          fontWeight: 700,
        }}
      >
        §{num} · {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          className="display tnum"
          style={{
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color,
            lineHeight: 1,
          }}
        >
          {score}
        </span>
        <span
          className="mono"
          style={{ fontSize: 11, color: 'var(--sa-ink-4)', fontWeight: 700 }}
        >
          /100
        </span>
      </div>
      <div
        style={{
          position: 'relative',
          height: 3,
          background: 'rgba(10, 10, 10, 0.1)',
          width: '100%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: 0,
            height: 5,
            width: `${Math.max(0, Math.min(100, score))}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Share Button
   ============================================================ */

function ShareButton({ reportId, isFr }: { reportId: string; isFr: boolean }) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);

  async function onShare() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/report/${reportId}/share`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('share failed');
      const data = (await res.json()) as { shareUrl?: string };
      const shareUrl = data.shareUrl ?? '';
      const full = `${window.location.origin}${shareUrl}`;
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail
    } finally {
      setBusy(false);
    }
  }

  const baseLabel = isFr ? 'Partager' : 'Share';
  const okLabel = isFr ? 'Copié ✓' : 'Copied ✓';

  return (
    <button
      type="button"
      onClick={onShare}
      disabled={busy}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="mono"
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '8px 14px',
        border: '2px solid var(--sa-ink)',
        background: hover ? 'var(--sa-ink)' : 'var(--sa-cream)',
        color: hover ? 'var(--sa-cream)' : 'var(--sa-ink)',
        cursor: busy ? 'wait' : 'pointer',
        transition: 'background 120ms ease, color 120ms ease',
      }}
    >
      {copied ? okLabel : baseLabel}
    </button>
  );
}

/* ============================================================
   CaptionBar — mini variant that can host a right action
   (inline so the share button can sit inside it)
   ============================================================ */

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

/* ============================================================
   Sidebar nav entry (Details tab)
   ============================================================ */

function SectionNavEntry({
  num,
  label,
  active,
  onClick,
}: {
  num: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        borderLeft: `3px solid ${active ? 'var(--sa-red)' : 'transparent'}`,
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: 'none',
        background: active ? 'var(--sa-cream-2)' : 'transparent',
        color: 'var(--sa-ink)',
        fontSize: 12,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontWeight: 700,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        className="tnum"
        style={{ color: active ? 'var(--sa-red)' : 'var(--sa-ink-4)' }}
      >
        §{num}
      </span>
      <span style={{ color: 'var(--sa-ink)' }}>{label}</span>
    </button>
  );
}

/* ============================================================
   Plan bucket renderer
   ============================================================ */

function PlanBucket({
  captionNum,
  label,
  items,
  dotColor,
}: {
  captionNum: string;
  label: string;
  items: PlanItem[];
  dotColor: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="frame" style={{ background: 'var(--sa-cream)' }}>
      <div
        className="ink-b mono"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 20px',
          background: 'var(--sa-ink)',
          color: 'var(--sa-cream)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ color: dotColor }}>&#9679;</span>
        <span>
          §{captionNum} · {label} · {items.length}
        </span>
      </div>
      <div>
        {items.map((item, i) => (
          <div
            key={`${item.n}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '56px 1fr 80px',
              gap: 16,
              padding: '20px 24px',
              borderBottom:
                i < items.length - 1 ? '1px solid var(--sa-rule)' : 'none',
              alignItems: 'start',
            }}
          >
            <div
              className="display tnum"
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: 'var(--sa-ink-4)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              {String(item.n).padStart(2, '0')}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: 'var(--sa-ink)',
                  fontSize: 15,
                  marginBottom: 4,
                  lineHeight: 1.35,
                }}
              >
                {item.title}
              </div>
              <div
                style={{
                  color: 'var(--sa-ink-3)',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {item.body}
              </div>
              <div
                className="mono"
                style={{
                  marginTop: 6,
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-4)',
                  fontWeight: 700,
                }}
              >
                {item.category}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  padding: '4px 8px',
                  border: '1px solid var(--sa-ink-4)',
                  color: 'var(--sa-ink)',
                  alignSelf: 'flex-start',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.effort}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   Overview content — compact by design, the Details tab owns depth
   ============================================================ */

function OverviewStatCard({
  num,
  label,
  value,
  sub,
}: {
  num: string;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div
      className="frame"
      style={{
        padding: '24px 24px 22px',
        background: 'var(--sa-cream)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--sa-ink-4)',
          fontWeight: 700,
        }}
      >
        §{num} · {label}
      </div>
      <div
        className="display tnum"
        style={{
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--sa-ink)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--sa-ink-3)',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function OverviewIssues({
  issues,
  isFr,
}: {
  issues: Array<Issue & { category: string }>;
  isFr: boolean;
}) {
  const top = issues.slice(0, 7);
  return (
    <div className="frame" style={{ background: 'var(--sa-cream)' }}>
      <div
        className="ink-b mono"
        style={{
          padding: '10px 20px',
          background: 'var(--sa-ink)',
          color: 'var(--sa-cream)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        §06 · {isFr ? 'Problèmes prioritaires' : 'Top issues'} · {issues.length}
      </div>
      {top.length === 0 ? (
        <div
          style={{
            padding: '24px',
            color: 'var(--sa-ink-3)',
            fontSize: 14,
          }}
        >
          {isFr ? 'Aucun problème détecté.' : 'No issues detected.'}
        </div>
      ) : (
        <div>
          {top.map((iss, i) => {
            const pillBg =
              iss.type === 'error'
                ? 'var(--sa-red)'
                : iss.type === 'warning'
                ? 'var(--sa-warn)'
                : 'var(--sa-ink-4)';
            const pillLabel =
              iss.type === 'error'
                ? isFr
                  ? 'CRIT'
                  : 'CRIT'
                : iss.type === 'warning'
                ? isFr
                  ? 'WARN'
                  : 'WARN'
                : 'INFO';
            return (
              <div
                key={`${iss.message}-${i}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr auto',
                  gap: 16,
                  padding: '14px 20px',
                  borderBottom:
                    i < top.length - 1 ? '1px solid var(--sa-rule)' : 'none',
                  alignItems: 'center',
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    padding: '4px 8px',
                    background: pillBg,
                    color: 'var(--sa-cream)',
                    textAlign: 'center',
                  }}
                >
                  {pillLabel}
                </span>
                <span
                  style={{
                    color: 'var(--sa-ink)',
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {iss.message}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--sa-ink-4)',
                    fontWeight: 700,
                  }}
                >
                  {iss.category}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ReportView
   ============================================================ */

export default function ReportView({
  report,
  reportId,
  readOnly,
  cwvLoading,
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
    ];
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
  const [section, setSection] = useState<SectionKey>('headings');

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
  const aiReadyScore =
    report.geoAnalysis && typeof report.geoAnalysis === 'object' && 'score' in report.geoAnalysis
      ? (Number((report.geoAnalysis as { score?: number }).score) || 0)
      : 0;
  const localScore = report.headings.score;

  const scorecardLabels = isFr
    ? ['SEO Technique', 'Contenu', 'IA-Ready', 'Visibilité locale']
    : ['Technical SEO', 'Content', 'AI-Ready', 'Local visibility'];

  // Section defs
  const sectionDefs: Array<{ key: SectionKey; num: string; label: string }> = [
    { key: 'headings', num: '01', label: isFr ? 'Structure sémantique' : 'Semantic structure' },
    { key: 'images', num: '02', label: isFr ? 'Images & médias' : 'Images & media' },
    { key: 'links', num: '03', label: isFr ? 'Liens & navigation' : 'Links & navigation' },
    { key: 'technical', num: '04', label: isFr ? 'Performance technique' : 'Technical performance' },
    { key: 'metadata', num: '05', label: isFr ? 'Métadonnées' : 'Metadata' },
    { key: 'readability', num: '06', label: isFr ? 'Lisibilité' : 'Readability' },
  ];

  const tabsMono = copy.tabsMono; // [OVERVIEW, DETAILS, ACTION PLAN]
  const tabKeys: TabKey[] = ['overview', 'details', 'plan'];

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
      {/* =====================================================
          1. MetricStrip
          ===================================================== */}
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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
            }}
          >
            <Scorecard
              num="02"
              label={scorecardLabels[0]}
              score={seoTechScore}
              isLast={false}
            />
            <Scorecard
              num="03"
              label={scorecardLabels[1]}
              score={contentScore}
              isLast={false}
            />
            <Scorecard
              num="04"
              label={scorecardLabels[2]}
              score={aiReadyScore}
              isLast={false}
            />
            <Scorecard
              num="05"
              label={scorecardLabels[3]}
              score={localScore}
              isLast={true}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          2. Verdict line
          ===================================================== */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--sa-rule)',
        }}
      >
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

      {/* =====================================================
          3. Tab bar
          ===================================================== */}
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

      {/* =====================================================
          4. Tab content
          ===================================================== */}
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
            isFr={isFr}
            critItems={critItems}
            warnItems={warnItems}
            infoItems={infoItems}
          />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Tab contents as sub-components
   ============================================================ */

function OverviewContent({
  report,
  headingsTotal,
  allIssues,
  isFr,
}: {
  report: AnalysisResult;
  headingsTotal: number;
  allIssues: Array<Issue & { category: string }>;
  isFr: boolean;
}) {
  const sortedIssues = useMemo(() => {
    const weight = (t: Issue['type']) => (t === 'error' ? 0 : t === 'warning' ? 1 : 2);
    return [...allIssues].sort((a, b) => weight(a.type) - weight(b.type));
  }, [allIssues]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        <OverviewStatCard
          num="03"
          label={isFr ? 'Titres & hiérarchie' : 'Headings'}
          value={headingsTotal}
          sub={`H1 ${report.headings.h1.length} · H2 ${report.headings.h2.length} · H3 ${report.headings.h3.length}`}
        />
        <OverviewStatCard
          num="04"
          label={isFr ? 'Images' : 'Images'}
          value={report.images.total}
          sub={
            isFr
              ? `${report.images.withAlt} avec alt · ${report.images.withoutAlt} sans alt`
              : `${report.images.withAlt} with alt · ${report.images.withoutAlt} without alt`
          }
        />
        <OverviewStatCard
          num="05"
          label={isFr ? 'Liens' : 'Links'}
          value={report.links.total}
          sub={
            isFr
              ? `${report.links.internal.length} internes · ${report.links.external.length} externes`
              : `${report.links.internal.length} internal · ${report.links.external.length} external`
          }
        />
      </div>

      <OverviewIssues issues={sortedIssues} isFr={isFr} />
    </div>
  );
}

function DetailsContent({
  report,
  cwvLoading,
  section,
  setSection,
  sectionDefs,
}: {
  report: AnalysisResult;
  cwvLoading?: boolean;
  section: SectionKey;
  setSection: (s: SectionKey) => void;
  sectionDefs: Array<{ key: SectionKey; num: string; label: string }>;
}) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    function handler() {
      setIsNarrow(window.innerWidth < 768);
    }
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const sidebarStyle: CSSProperties = isNarrow
    ? {
        display: 'flex',
        gap: 0,
        overflowX: 'auto',
        borderBottom: '1px solid var(--sa-rule)',
        marginBottom: 16,
      }
    : {
        position: 'sticky',
        top: 24,
        alignSelf: 'start',
        borderRight: '1px solid var(--sa-rule)',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      };

  const content = (() => {
    switch (section) {
      case 'headings':
        return (
          <HeadingsTab
            data={report.headings}
            keywords={report.keywords}
            url={report.url}
          />
        );
      case 'images':
        return <ImagesTab data={report.images} />;
      case 'links':
        return <LinksTab data={report.links} />;
      case 'technical':
        return <TechnicalTab data={report.technical} cwvLoading={cwvLoading} />;
      case 'metadata':
        return <MetadataTab data={report.metadata} />;
      case 'readability':
        return <ReadabilityTab data={report.readability} />;
      default:
        return null;
    }
  })();

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isNarrow ? '1fr' : '240px 1fr',
        gap: 24,
      }}
    >
      <nav style={sidebarStyle}>
        {sectionDefs.map((s) => (
          <SectionNavEntry
            key={s.key}
            num={s.num}
            label={s.label}
            active={section === s.key}
            onClick={() => setSection(s.key)}
          />
        ))}
      </nav>
      <div>{content}</div>
    </div>
  );
}

function PlanContent({
  copy,
  isFr,
  critItems,
  warnItems,
  infoItems,
}: {
  copy: (typeof COPY)['fr'];
  isFr: boolean;
  critItems: PlanItem[];
  warnItems: PlanItem[];
  infoItems: PlanItem[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* §99 CTA Banner */}
      <div
        className="frame"
        style={{ background: 'var(--sa-cream)', padding: '40px 48px' }}
      >
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-ink)',
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          {copy.ctaBannerCaption}
        </div>
        <div
          className="mono caption-red"
          style={{
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-red)',
            fontWeight: 700,
            marginBottom: 20,
          }}
        >
          {copy.ctaBannerKicker}
        </div>

        <DisplayTitle parts={copy.ctaBannerTitle} size="sect" as="h2" />

        <p
          style={{
            margin: '20px 0 28px 0',
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--sa-ink-3)',
            maxWidth: 720,
          }}
        >
          {copy.ctaBannerSub}
        </p>

        <div
          style={{
            display: 'flex',
            gap: 20,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <a
            href="https://pixelab.ch/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="mono"
            style={{
              background: 'var(--sa-ink)',
              color: 'var(--sa-cream)',
              padding: '14px 28px',
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              border: '2px solid var(--sa-ink)',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {copy.ctaBannerPrimary}
          </a>
          <span
            className="mono"
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--sa-ink)',
              borderBottom: '1px solid var(--sa-ink)',
              paddingBottom: 2,
              cursor: 'default',
            }}
          >
            {isFr ? 'Exporter ce rapport →' : 'Export this report →'}
          </span>
        </div>
      </div>

      {/* Buckets */}
      <PlanBucket
        captionNum="10"
        label={copy.planBucketCrit}
        items={critItems}
        dotColor="var(--sa-red)"
      />
      <PlanBucket
        captionNum="11"
        label={copy.planBucketWarn}
        items={warnItems}
        dotColor="var(--sa-warn)"
      />
      <PlanBucket
        captionNum="12"
        label={copy.planBucketInfo}
        items={infoItems}
        dotColor="var(--sa-ink-4)"
      />
    </div>
  );
}
