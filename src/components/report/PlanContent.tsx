'use client';

import { DisplayTitle } from '@/components/design-system/primitives';
import type { COPY } from '@/lib/i18n/copy';
import type { PlanItem } from '@/lib/engine/plan';
import { PlanBucket } from './PlanBucket';

interface PlanContentProps {
  copy: (typeof COPY)['fr'];
  critItems: PlanItem[];
  warnItems: PlanItem[];
  infoItems: PlanItem[];
}

/**
 * "Action plan" tab: CTA banner on top, then 3 stacked buckets
 * (critical, warnings, info) populated from `lib/engine/plan.buildPlan`.
 *
 * Phase 4 will extend `buildPlan` to absorb /api/geo-analyze recommendations,
 * which currently aren't shown anywhere — they'll surface here.
 */
export function PlanContent({ copy, critItems, warnItems, infoItems }: PlanContentProps) {
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
