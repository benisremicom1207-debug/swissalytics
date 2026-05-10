'use client';

import { useTheme } from '@/components/design-system/ThemeProvider';
import { COPY } from '@/lib/i18n/copy';
import { RedPing } from '@/components/design-system/primitives';

const GLYPHS = ['◧', '◨', '◫', '◩', '◪'];

/**
 * P7.1 — Honest indeterminate loader.
 *
 * The previous version simulated 5 sequential "steps" via a 3s timer
 * (`stepInterval` in page.tsx) — fake progress that lied about what
 * the analyzer was doing. In reality, all 5 sub-analyses run in
 * parallel inside `analyzePage`, completing together when the HTTP
 * fetch + cheerio parse + 5 module calls all settle.
 *
 * New design:
 *   - All 5 categories rendered as "running" simultaneously
 *   - Indeterminate scanner bar (CSS keyframe, not value-driven)
 *   - No fake percent counter
 *   - Same brutalist v2 visual language (frame, mono captions, ink-b)
 */
export default function AnalyzerLoading() {
  const { lang } = useTheme();
  const copy = COPY[lang];

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="frame" style={{ background: 'var(--sa-bg)' }}>
        {/* Caption bar */}
        <div
          className="ink-b"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            background: 'var(--sa-ink)',
            color: 'var(--sa-cream)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RedPing size={10} />
            <span
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {lang === 'fr' ? '§ Analyse en cours' : '§ Analyzing'}
            </span>
          </div>
          <span
            className="mono"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            {lang === 'fr' ? '5 analyses parallèles' : '5 parallel passes'}
          </span>
        </div>

        {/* Indeterminate scanner — CSS animation, no fake % value */}
        <div
          style={{
            position: 'relative',
            height: 5,
            background: 'rgba(10,10,10,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: '40%',
              background: 'var(--sa-red)',
              animation: 'sa-scorecard-scan 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        </div>

        {/* All 5 categories shown as concurrent — no fake sequencing */}
        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {copy.steps.map((s, i) => (
            <li
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                padding: '18px 24px',
                borderBottom: i < copy.steps.length - 1 ? '1px solid var(--sa-rule)' : 0,
              }}
            >
              <span
                className="mono tnum"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'var(--sa-ink)',
                }}
              >
                {s.id.toString().padStart(2, '0')}
              </span>
              <span
                style={{
                  width: 36,
                  height: 36,
                  border: '1px solid var(--sa-ink)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--sa-font-mono)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--sa-ink)',
                  flexShrink: 0,
                }}
                aria-hidden
              >
                {GLYPHS[i]}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: '-0.01em',
                    color: 'var(--sa-ink)',
                  }}
                >
                  {s.label}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: '0.06em',
                    color: 'var(--sa-ink-3)',
                    marginTop: 2,
                  }}
                >
                  {s.desc}
                </div>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '3px 8px',
                  border: '1px solid var(--sa-ink)',
                  background: 'var(--sa-ink)',
                  color: 'var(--sa-cream)',
                }}
              >
                {lang === 'fr' ? 'EN COURS' : 'RUNNING'}
              </span>
            </li>
          ))}
        </ol>

        {/* Footer */}
        <div
          className="ink-t mono"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            background: 'var(--sa-cream-2)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-ink-4)',
          }}
        >
          <span>{copy.loadingFooter}</span>
          <span>{lang === 'fr' ? '~ 30 s' : '~ 30 s'}</span>
        </div>
      </div>
    </div>
  );
}
