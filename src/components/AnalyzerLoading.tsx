'use client';

import { useTheme } from '@/components/design-system/ThemeProvider';
import { COPY } from '@/lib/i18n/copy';
import { RedPing } from '@/components/design-system/primitives';

interface AnalyzerLoadingProps {
  step: number;
}

const GLYPHS = ['◧', '◨', '◫', '◩', '◪'];

export default function AnalyzerLoading({ step }: AnalyzerLoadingProps) {
  const { lang } = useTheme();
  const copy = COPY[lang];
  const pct = Math.min(step * 20, 99);
  const captionLabel = copy.loadingCaption.replace('0x', `0${Math.max(1, Math.min(5, step || 1))}`);

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
              {captionLabel}
            </span>
          </div>
          <span
            className="mono tnum"
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em' }}
          >
            {pct.toString().padStart(2, '0')}%
          </span>
        </div>

        {/* Progress rail */}
        <div style={{ height: 5, background: 'rgba(10,10,10,0.1)', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${pct}%`,
              background: 'var(--sa-red)',
              transition: 'width 320ms cubic-bezier(0.2, 0, 0, 1)',
            }}
          />
        </div>

        {/* Step list */}
        <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {copy.steps.map((s, i) => {
            const done = step > s.id;
            const active = step === s.id;
            return (
              <li
                key={s.id}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 24,
                  padding: '20px 24px',
                  background: active ? 'var(--sa-cream-2)' : 'transparent',
                  borderBottom: i < copy.steps.length - 1 ? '1px solid var(--sa-rule)' : 0,
                }}
              >
                {active && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: 3,
                      background: 'var(--sa-red)',
                    }}
                  />
                )}
                <span
                  className="mono tnum"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: done ? 'var(--sa-ink-4)' : 'var(--sa-ink)',
                  }}
                >
                  {s.id.toString().padStart(2, '0')}
                </span>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    border: done ? '1px solid var(--sa-rule)' : '1px solid var(--sa-ink)',
                    background: active ? 'var(--sa-ink)' : 'transparent',
                    color: active
                      ? 'var(--sa-cream)'
                      : done
                      ? 'var(--sa-ink-4)'
                      : 'var(--sa-ink-3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--sa-font-mono)',
                    fontSize: 14,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  {GLYPHS[i]}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: done ? 'var(--sa-ink-4)' : 'var(--sa-ink)',
                      textDecoration: done ? 'line-through' : 'none',
                    }}
                  >
                    {s.label}
                  </div>
                  {active && (
                    <div
                      className="mono"
                      style={{
                        fontSize: 11,
                        letterSpacing: '0.06em',
                        color: 'var(--sa-ink-3)',
                        marginTop: 4,
                      }}
                    >
                      {s.desc}
                    </div>
                  )}
                </div>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    border: `1px solid ${
                      done ? 'var(--sa-ok)' : active ? 'var(--sa-ink)' : 'var(--sa-rule)'
                    }`,
                    background: active ? 'var(--sa-ink)' : 'transparent',
                    color: done
                      ? 'var(--sa-ok)'
                      : active
                      ? 'var(--sa-cream)'
                      : 'var(--sa-ink-4)',
                  }}
                >
                  {done ? 'DONE' : active ? 'RUN' : 'WAIT'}
                </span>
              </li>
            );
          })}
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
          <span className="tnum">{Math.max(0, Math.min(5, step))}/5</span>
        </div>
      </div>
    </div>
  );
}
