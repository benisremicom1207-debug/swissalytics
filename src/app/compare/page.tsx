'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import { DisplayTitle, Pixel } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';
import {
  listCompare,
  formatCompareDate,
  pickCategory,
  pickTldr,
} from '@/lib/compare/pages';

export default function CompareIndexPage() {
  const { lang } = useTheme();
  const isFr = lang === 'fr';
  const pages = useMemo(() => listCompare(), []);
  const editionNum = String(pages.length).padStart(2, '0');

  return (
    <Shell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        {/* ──────────────────────────
            Masthead
           ────────────────────────── */}
        <div
          style={{
            borderBottom: '2px solid var(--sa-ink)',
            paddingBottom: 32,
            marginBottom: 48,
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--sa-ink-4)',
              marginBottom: 14,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              borderBottom: '1px solid var(--sa-rule)',
              paddingBottom: 12,
            }}
          >
            <span>
              Swissalytics · {isFr ? 'Comparatifs' : 'Comparisons'}
            </span>
            <span>
              {isFr ? 'Mis à jour depuis Genève' : 'Updated from Geneva'}
            </span>
            <span>№ {editionNum}</span>
          </div>

          <div
            className="mono caption-red"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--sa-red)',
              marginBottom: 16,
            }}
          >
            § {isFr ? 'Comparatifs' : 'Comparisons'}
          </div>

          <DisplayTitle
            parts={
              isFr
                ? ['Swissalytics face', ['aux autres outils', { red: '.' }]]
                : ['Swissalytics versus', ['the other tools', { red: '.' }]]
            }
            size="page"
          />

          <p
            style={{
              fontSize: 20,
              color: 'var(--sa-ink-2)',
              marginTop: 24,
              maxWidth: 780,
              lineHeight: 1.5,
            }}
          >
            {isFr
              ? "Comparatifs honnêtes face aux principaux outils SEO et GEO du marché. Prix, fonctionnalités, cas d'usage — sans détour, sans biais commercial déguisé."
              : 'Honest breakdowns of how Swissalytics compares to leading SEO and GEO tools. Pricing, features, use cases — straight, no hidden agenda.'}
          </p>
        </div>

        {/* ──────────────────────────
            Compare cards grid
           ────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 24,
            marginBottom: 72,
          }}
        >
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={`/compare/${p.slug}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <article
                className="sa-rise"
                style={{
                  border: '2px solid var(--sa-ink)',
                  background: 'var(--sa-cream)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                {/* Top vs bar */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    alignItems: 'stretch',
                    borderBottom: '2px solid var(--sa-ink)',
                  }}
                >
                  {/* SA monogram */}
                  <div
                    style={{
                      background: 'var(--sa-cream)',
                      padding: '20px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 4,
                      borderRight: '1px solid var(--sa-rule)',
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--sa-red)',
                      }}
                    >
                      ★ {isFr ? 'Notre outil' : 'Our tool'}
                    </div>
                    <div
                      className="display"
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        color: 'var(--sa-ink)',
                      }}
                    >
                      Swissalytics
                    </div>
                  </div>

                  {/* VS */}
                  <div
                    style={{
                      background: 'var(--sa-ink)',
                      color: 'var(--sa-cream)',
                      padding: '0 14px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      className="display"
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        fontFamily: 'var(--sa-font-sans)',
                      }}
                    >
                      VS
                    </span>
                  </div>

                  {/* Competitor */}
                  <div
                    style={{
                      background: 'var(--sa-cream-2)',
                      padding: '20px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--sa-ink-4)',
                      }}
                    >
                      {p.competitorMonogram}
                    </div>
                    <div
                      className="display"
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        lineHeight: 1,
                        color: 'var(--sa-ink)',
                      }}
                    >
                      {p.competitor}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div
                  style={{
                    padding: '24px 22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    flex: 1,
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'var(--sa-red)',
                    }}
                  >
                    {pickCategory(p, isFr)}
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      color: 'var(--sa-ink-2)',
                      lineHeight: 1.5,
                      margin: 0,
                      textWrap: 'pretty',
                      flex: 1,
                    }}
                  >
                    {pickTldr(p, isFr)}
                  </p>
                  <div
                    className="mono"
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      paddingTop: 14,
                      borderTop: '1px solid var(--sa-rule)',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--sa-ink-4)',
                    }}
                  >
                    <span>
                      {isFr ? 'Mis à jour' : 'Updated'}{' '}
                      {formatCompareDate(p.updated, lang)}
                    </span>
                    <span style={{ color: 'var(--sa-red)' }}>
                      {isFr ? 'Lire →' : 'Read →'}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* ──────────────────────────
            Future comparisons callout
           ────────────────────────── */}
        <div
          style={{
            border: '2px solid var(--sa-ink)',
            background: 'var(--sa-cream-2)',
            padding: '36px 32px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 32,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--sa-red)',
                marginBottom: 12,
              }}
            >
              § {isFr ? 'Suggérer un comparatif' : 'Suggest a comparison'}
            </div>
            <h3
              className="display"
              style={{
                fontSize: 'clamp(22px, 2.6vw, 30px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              {isFr
                ? 'Un outil que vous voudriez voir comparé ?'
                : 'A tool you would like compared?'}
              <Pixel />
            </h3>
            <p
              style={{
                fontSize: 15,
                color: 'var(--sa-ink-3)',
                margin: '12px 0 0 0',
                lineHeight: 1.5,
                maxWidth: 540,
              }}
            >
              {isFr
                ? 'On publie de nouveaux comparatifs en fonction des outils que vous utilisez. Envoyez-nous le nom, on regarde.'
                : 'We publish new comparisons based on the tools you use. Send us the name, we look into it.'}
            </p>
          </div>
          <a
            href="mailto:hello@swissalytics.com?subject=Comparatif%20Swissalytics%20vs%20..."
            style={{
              padding: '12px 20px',
              background: 'var(--sa-ink)',
              color: 'var(--sa-cream)',
              border: '2px solid var(--sa-ink)',
              fontFamily: 'var(--sa-font-mono)',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            hello@swissalytics.com
          </a>
        </div>
      </div>
    </Shell>
  );
}
