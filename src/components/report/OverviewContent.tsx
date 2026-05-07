'use client';

import { useMemo } from 'react';
import type { AnalysisResult, Issue } from '@/lib/types';

interface OverviewContentProps {
  report: AnalysisResult;
  headingsTotal: number;
  allIssues: Array<Issue & { category: string }>;
  isFr: boolean;
}

/* ---------------- private helpers (only used here) ---------------- */

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
              iss.type === 'error' ? 'CRIT' : iss.type === 'warning' ? 'WARN' : 'INFO';
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

/* ---------------- exported tab content ---------------- */

export function OverviewContent({
  report,
  headingsTotal,
  allIssues,
  isFr,
}: OverviewContentProps) {
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
