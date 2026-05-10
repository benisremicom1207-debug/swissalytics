'use client';

/**
 * Shared brutalist-v2 primitives for the Detail tabs (Headings,
 * Images, Links, Technical, Metadata, Readability). Extracted to keep
 * the per-tab files focused on data + layout, not styling boilerplate.
 *
 * Conventions:
 *   - Outer wrapper of a tab: `<div className="frame" style={{ background: var(--sa-cream), padding: '32px 36px' }}>`
 *   - Each section: `<SectionHeader num="01" title="…" info={...} />` then content
 *   - Status pills: `<CheckPill label="..." ok={...} />`
 */

import type React from 'react';

interface SectionHeaderProps {
  /** Optional section number ("01", "02"…). Omit or pass empty string to hide the §-marker (used for sub-sections like link tables). */
  num?: string;
  title: string;
  info?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export function SectionHeader({ num, title, info, rightSlot }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        borderBottom: '1px solid var(--sa-rule)',
        paddingBottom: 12,
        flexWrap: 'wrap',
      }}
    >
      {num && (
        <span
          className="mono"
          style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--sa-ink-4)', fontWeight: 700 }}
        >
          §{num}
        </span>
      )}
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--sa-ink)', margin: 0, letterSpacing: '-0.01em', flex: 1, minWidth: 200 }}>
        {title}
      </h3>
      {rightSlot}
      {info && <span style={{ flexShrink: 0 }}>{info}</span>}
    </div>
  );
}

interface CheckPillProps {
  label: string;
  ok: boolean;
  /** Status label override — defaults to "✓ OK" / "ABSENT". */
  status?: string;
  /** Tone override: pass 'warn' to render in --sa-warn instead of red when !ok. */
  tone?: 'error' | 'warn';
  /** Optional value rendered under the label (e.g. tag content). */
  value?: string | null;
}

export function CheckPill({ label, ok, status, tone = 'error', value }: CheckPillProps) {
  const fail = tone === 'warn' ? 'var(--sa-warn)' : 'var(--sa-red)';
  const failBg = tone === 'warn' ? 'rgba(184, 123, 0, 0.06)' : 'rgba(229, 36, 26, 0.05)';
  const stroke = ok ? 'var(--sa-ok)' : fail;
  const bg = ok ? 'rgba(47, 107, 63, 0.06)' : failBg;
  const txt = ok ? 'var(--sa-ok)' : fail;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '10px 12px',
        border: `1px solid ${stroke}`,
        background: bg,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--sa-ink-2)', fontWeight: 500 }}>{label}</div>
        {value && (
          <div
            style={{ fontSize: 11, color: 'var(--sa-ink-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}
            title={value}
          >
            {value}
          </div>
        )}
      </div>
      <span
        className="mono"
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: txt,
          flexShrink: 0,
        }}
      >
        {status ?? (ok ? '✓ OK' : 'ABSENT')}
      </span>
    </div>
  );
}

/**
 * Cream-on-cream framed card with a mono caption header. Used as the
 * default content container inside a section.
 */
export function MonoCard({
  caption,
  children,
  background = 'var(--sa-cream-2)',
  padding = 20,
}: {
  caption?: string;
  children: React.ReactNode;
  background?: string;
  padding?: number;
}) {
  return (
    <div style={{ border: '1px solid var(--sa-rule)', background, padding }}>
      {caption && (
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-ink-4)',
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {caption}
        </div>
      )}
      {children}
    </div>
  );
}

/** Outer tab wrapper — bold 2px frame on cream background. */
export function TabFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="frame" style={{ background: 'var(--sa-cream)', padding: '32px 36px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>{children}</div>
    </div>
  );
}
