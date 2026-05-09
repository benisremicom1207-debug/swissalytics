'use client';

import type { PlanItem } from '@/lib/engine/plan';

interface PlanBucketProps {
  captionNum: string;
  label: string;
  items: PlanItem[];
  /** CSS color for the leading dot in the caption bar (red/warn/grey). */
  dotColor: string;
}

/**
 * Renders one bucket (CRIT / WARN / INFO) of the action plan. Items come
 * from `lib/engine/plan.buildPlan(report)`. Returns null when empty so
 * absent buckets don't take vertical space.
 */
export function PlanBucket({ captionNum, label, items, dotColor }: PlanBucketProps) {
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
