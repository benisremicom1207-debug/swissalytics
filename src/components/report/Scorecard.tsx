'use client';

import { scoreColor } from '@/components/design-system/primitives';

interface ScorecardProps {
  num: string;
  label: string;
  /** null = data not yet available (async fetch in flight) → render loading state */
  score: number | null;
  isLast: boolean;
}

/**
 * One of the 4 dimension cards in the right cell of the MetricStrip.
 *
 * Loading state (score === null) renders pulsing '···' + an indeterminate
 * scanner bar; used by the IA-Ready scorecard while /api/geo-analyze is in
 * flight (it's fetched async after the main /api/analyze response).
 */
export function Scorecard({ num, label, score, isLast }: ScorecardProps) {
  const isLoading = score === null;
  const color = isLoading ? 'var(--sa-ink-4)' : scoreColor(score);
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
            ...(isLoading ? { animation: 'sa-flash 1.4s ease-in-out infinite' } : {}),
          }}
        >
          {isLoading ? '···' : score}
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
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div
            style={{
              position: 'absolute',
              top: -1,
              left: 0,
              height: 5,
              width: '40%',
              background: 'var(--sa-ink-4)',
              animation: 'sa-scorecard-scan 1.6s ease-in-out infinite',
            }}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
}
