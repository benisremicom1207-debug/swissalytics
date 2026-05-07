'use client';

import { scoreColor, scoreGrade } from '@/components/design-system/primitives';

/**
 * Pure inline-SVG circular gauge — no animation, no client state.
 * Used in the MetricStrip to display the global report score.
 */
export function Gauge({ score }: { score: number }) {
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
