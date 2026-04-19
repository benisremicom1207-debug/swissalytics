'use client';

import type { CSSProperties, ReactNode } from 'react';
import React from 'react';

/* ============================================================
   Fragment renderer — powers DisplayTitle parts
   ============================================================ */
export type FragmentNode =
  | string
  | { i: string } // italic serif (verdict-ish)
  | { red: string } // red text or red pixel when red === '.'
  | FragmentNode[];

export function renderFragment(f: FragmentNode, key?: React.Key): ReactNode {
  if (typeof f === 'string') return <React.Fragment key={key}>{f}</React.Fragment>;
  if (Array.isArray(f))
    return <React.Fragment key={key}>{f.map((x, i) => renderFragment(x, i))}</React.Fragment>;
  if ('i' in f)
    return (
      <em key={key} className="serif" style={{ fontStyle: 'italic', fontWeight: 500 }}>
        {f.i}
      </em>
    );
  if (f.red === '.') return <Pixel key={key} />;
  return (
    <span key={key} style={{ color: 'var(--sa-red)' }}>
      {f.red}
    </span>
  );
}

/* ============================================================
   Pixel — brand mark, red square at end of display titles
   ============================================================ */
export function Pixel({
  size = 0.18,
  title,
  style,
}: {
  size?: number;
  title?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-label={title || 'pixel'}
      style={{
        display: 'inline-block',
        width: `${size}em`,
        height: `${size}em`,
        background: 'var(--sa-red)',
        marginLeft: '0.04em',
        verticalAlign: 'baseline',
        lineHeight: 0,
        ...style,
      }}
    />
  );
}

/* ============================================================
   DisplayTitle — hero / page / section sizing + Pixel + italic
   ============================================================ */
const DISPLAY_SIZES: Record<'hero' | 'page' | 'sect', CSSProperties> = {
  hero: { fontSize: 'clamp(56px, 8vw, 132px)', letterSpacing: '-0.04em', lineHeight: 0.92 },
  page: { fontSize: 'clamp(44px, 6vw, 96px)', letterSpacing: '-0.035em', lineHeight: 0.94 },
  sect: { fontSize: 'clamp(32px, 4vw, 56px)', letterSpacing: '-0.03em', lineHeight: 1.0 },
};

export function DisplayTitle({
  parts,
  size = 'hero',
  as: Tag = 'h1',
  className,
  style,
}: {
  parts: FragmentNode[];
  size?: 'hero' | 'page' | 'sect';
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}) {
  const TagEl = Tag as any;
  return (
    <TagEl
      className={['display', className].filter(Boolean).join(' ')}
      style={{ ...DISPLAY_SIZES[size], margin: 0, color: 'var(--sa-ink)', ...style }}
    >
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          {renderFragment(p, i)}
          {i < parts.length - 1 && <br />}
        </React.Fragment>
      ))}
    </TagEl>
  );
}

/* ============================================================
   Logo — inline SVG wordmark (tints on dark via CSS vars)
   ============================================================ */
export function Logo({ size = 28, label = true }: { size?: number; label?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 64 64" style={{ display: 'block' }} aria-hidden>
        <rect width="64" height="64" fill="var(--sa-ink)" />
        <rect x="14" y="14" width="28" height="8" fill="var(--sa-cream)" />
        <rect x="14" y="28" width="36" height="8" fill="var(--sa-cream)" />
        <rect x="22" y="42" width="28" height="8" fill="var(--sa-cream)" />
        <rect x="46" y="14" width="4" height="8" fill="var(--sa-red)" />
        <rect x="14" y="42" width="4" height="8" fill="var(--sa-red)" />
      </svg>
      {label && (
        <span
          style={{
            fontFamily: 'var(--sa-font-sans)',
            fontWeight: 800,
            fontSize: 20,
            letterSpacing: '-0.03em',
            color: 'var(--sa-ink)',
          }}
        >
          Swissalytics
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              background: 'var(--sa-red)',
              marginLeft: 2,
              verticalAlign: 'baseline',
            }}
          />
        </span>
      )}
    </span>
  );
}

/* ============================================================
   Chip — mono badge (default, inverted, accent)
   ============================================================ */
export function Chip({
  children,
  inverted,
  accent,
  className,
  style,
}: {
  children: ReactNode;
  inverted?: boolean;
  accent?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={['mono', className].filter(Boolean).join(' ')}
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        border: `1px solid ${accent ? 'var(--sa-red)' : 'var(--sa-ink)'}`,
        background: inverted ? 'var(--sa-ink)' : accent ? 'var(--sa-red)' : 'transparent',
        color: inverted ? 'var(--sa-cream)' : accent ? 'var(--sa-cream)' : 'var(--sa-ink)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ============================================================
   Caption — mono §0x uppercase caption
   ============================================================ */
export function Caption({
  children,
  tone = 'meta',
  className,
  style,
}: {
  children: ReactNode;
  tone?: 'meta' | 'ink' | 'red';
  className?: string;
  style?: CSSProperties;
}) {
  const color =
    tone === 'red' ? 'var(--sa-red)' : tone === 'ink' ? 'var(--sa-ink)' : 'var(--sa-ink-4)';
  return (
    <span className={['caption', className].filter(Boolean).join(' ')} style={{ color, ...style }}>
      {children}
    </span>
  );
}

/* ============================================================
   Frame — ink 2px frame wrapper
   ============================================================ */
export function Frame({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={['frame', className].filter(Boolean).join(' ')} style={style}>
      {children}
    </div>
  );
}

/* ============================================================
   CaptionBar — ink strip atop a Frame with §0x label + meta
   ============================================================ */
export function CaptionBar({
  label,
  right,
}: {
  label: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div
      className="ink-b mono"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        background: 'var(--sa-ink)',
        color: 'var(--sa-cream)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      <span>{label}</span>
      {right !== undefined && <span style={{ opacity: 0.7 }}>{right}</span>}
    </div>
  );
}

/* ============================================================
   RedPing — red dot with ping animation
   ============================================================ */
export function RedPing({ size = 10 }: { size?: number }) {
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <span
        className="sa-ping"
        style={{ position: 'absolute', inset: 0, background: 'var(--sa-red)' }}
      />
      <span style={{ position: 'relative', width: size, height: size, background: 'var(--sa-red)' }} />
    </span>
  );
}

/* ============================================================
   Score helpers
   ============================================================ */
export function scoreColor(n: number): string {
  if (n >= 80) return 'var(--sa-ok)';
  if (n >= 60) return 'var(--sa-warn)';
  return 'var(--sa-red)';
}
export function scoreGrade(n: number): string {
  if (n >= 90) return 'A';
  if (n >= 80) return 'B';
  if (n >= 70) return 'C';
  if (n >= 60) return 'D';
  return 'F';
}
