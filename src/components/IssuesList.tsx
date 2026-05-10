'use client';

import type { Issue } from '@/lib/types';
import { getIssueTip } from '@/lib/issueTips';

const issueTones: Record<Issue['type'], { stroke: string; bg: string; label: string }> = {
  error:   { stroke: 'var(--sa-red)',  bg: 'rgba(229, 36, 26, 0.05)', label: 'CRITIQUE' },
  warning: { stroke: 'var(--sa-warn)', bg: 'rgba(184, 123, 0, 0.05)', label: 'ATTENTION' },
  info:    { stroke: 'var(--sa-rule)', bg: 'var(--sa-cream-2)',       label: 'INFO' },
};

const labelColor: Record<Issue['type'], string> = {
  error:   'var(--sa-red)',
  warning: 'var(--sa-warn)',
  info:    'var(--sa-ink-4)',
};

export default function IssuesList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;

  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
          borderBottom: '1px solid var(--sa-rule)',
          paddingBottom: 10,
        }}
      >
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--sa-ink-4)', fontWeight: 700 }}>
          §00
        </span>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--sa-ink)', margin: 0, letterSpacing: '-0.01em' }}>
          Problèmes détectés ({issues.length})
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {issues.map((issue, i) => {
          const tone = issueTones[issue.type];
          const tip = getIssueTip(issue.message);
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '4px 1fr',
                gap: 14,
                padding: 14,
                border: `1px solid ${tone.stroke}`,
                background: tone.bg,
              }}
            >
              <div style={{ background: tone.stroke, alignSelf: 'stretch' }} />
              <div>
                <p style={{ fontSize: 13, color: 'var(--sa-ink)', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                  {issue.message}
                </p>
                {tip && (
                  <p style={{ fontSize: 12, color: 'var(--sa-ink-3)', margin: '6px 0 0 0', lineHeight: 1.55 }}>
                    {tip}
                  </p>
                )}
                <span
                  className="mono"
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    padding: '2px 6px',
                    border: `1px solid ${labelColor[issue.type]}`,
                    color: labelColor[issue.type],
                    background: 'var(--sa-cream)',
                  }}
                >
                  {tone.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
