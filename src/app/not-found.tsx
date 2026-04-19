'use client';

import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import { Pixel } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';

export default function NotFound() {
  const { lang } = useTheme();
  const isFr = lang === 'fr';

  return (
    <Shell>
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '64px 24px',
          minHeight: 'calc(100vh - 320px)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%' }}>
          <div
            className="mono caption-red"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--sa-red)',
              marginBottom: 20,
            }}
          >
            §404 — {isFr ? 'Non trouvé' : 'Not found'}
          </div>

          <span
            className="display"
            style={{
              display: 'block',
              fontWeight: 800,
              fontSize: 'clamp(88px, 14vw, 200px)',
              lineHeight: 0.88,
              letterSpacing: '-0.05em',
              color: 'var(--sa-ink)',
            }}
          >
            404
            <Pixel size={0.18} />
          </span>

          <div
            style={{
              borderTop: '2px solid var(--sa-ink)',
              marginTop: 32,
              paddingTop: 28,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 40,
            }}
          >
            <div>
              <h2
                className="h1"
                style={{
                  fontSize: 40,
                  margin: '0 0 16px 0',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                }}
              >
                {isFr ? 'Page introuvable' : 'Page not found'}
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: 'var(--sa-ink-3)',
                  maxWidth: 480,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {isFr
                  ? "Cette page n'existe pas — ou plus. Le site a peut-être été réorganisé depuis votre dernier passage."
                  : "This page doesn't exist — or no longer does. The site may have been reorganised since you last visited."}
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <Link
                  href="/"
                  className="mono"
                  style={{
                    padding: '14px 24px',
                    background: 'var(--sa-red)',
                    color: 'var(--sa-cream)',
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    border: '2px solid var(--sa-ink)',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  ← {isFr ? "Retour à l'accueil" : 'Back home'}
                </Link>
                <Link
                  href="/exemples"
                  className="mono"
                  style={{
                    padding: '14px 24px',
                    background: 'transparent',
                    color: 'var(--sa-ink)',
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    border: '2px solid var(--sa-ink)',
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {isFr ? 'Voir les exemples' : 'See examples'}
                </Link>
              </div>
            </div>

            <div
              className="mono"
              style={{
                fontSize: 12,
                lineHeight: 1.8,
                color: 'var(--sa-ink-3)',
              }}
            >
              <div
                style={{
                  borderBottom: '1px dotted var(--sa-rule)',
                  paddingBottom: 6,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: 'var(--sa-ink-4)' }}>STATUS</span>
                &nbsp;&nbsp;404 NOT_FOUND
              </div>
              <div
                style={{
                  borderBottom: '1px dotted var(--sa-rule)',
                  paddingBottom: 6,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: 'var(--sa-ink-4)' }}>HOST&nbsp;&nbsp;&nbsp;</span>
                &nbsp;&nbsp;swissalytics.ch
              </div>
              <div
                style={{
                  borderBottom: '1px dotted var(--sa-rule)',
                  paddingBottom: 6,
                  marginBottom: 6,
                }}
              >
                <span style={{ color: 'var(--sa-ink-4)' }}>REGION&nbsp;</span>
                &nbsp;&nbsp;CH / GE
              </div>
              <div>
                <span style={{ color: 'var(--sa-ink-4)' }}>TRACE&nbsp;&nbsp;</span>
                &nbsp;&nbsp;0x4e2a · f0f4 · 81b3
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
