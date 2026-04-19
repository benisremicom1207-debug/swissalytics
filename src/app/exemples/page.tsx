'use client';

import React from 'react';
import Shell from '@/components/design-system/Shell';
import { DisplayTitle, scoreColor } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';

type Case = {
  sector: string;
  url: string;
  before: number;
  after: number;
  win: string;
  quote: string;
};

export default function ExemplesPage() {
  const { lang } = useTheme();
  const isFr = lang === 'fr';

  const cases: Case[] = [
    {
      sector: isFr ? 'Horlogerie · Genève' : 'Watchmaking · Geneva',
      url: 'patek-example.ch',
      before: 42,
      after: 87,
      win: isFr ? 'LCP divisé par 3' : 'LCP cut 3×',
      quote: isFr
        ? 'La structure des pages produit a été entièrement refaite en 4 semaines.'
        : 'Product page structure rebuilt in 4 weeks.',
    },
    {
      sector: isFr ? 'Restauration · Vaud' : 'Restaurant · Vaud',
      url: 'table-de-lausanne.ch',
      before: 56,
      after: 91,
      win: isFr ? '+340% trafic local' : '+340% local traffic',
      quote: isFr
        ? 'Schéma LocalBusiness + llms.txt. Deux semaines après, nous étions cités par ChatGPT.'
        : 'LocalBusiness schema + llms.txt. Two weeks later, ChatGPT was citing us.',
    },
    {
      sector: isFr ? 'SaaS B2B · Zurich' : 'B2B SaaS · Zurich',
      url: 'cronos-api.io',
      before: 71,
      after: 94,
      win: isFr ? 'Score IA : 54 → 92' : 'AI score: 54 → 92',
      quote: isFr
        ? "Le plan d'action était priorisé. On a commencé par le top 5, résultat immédiat."
        : 'Action plan was prioritized. Top 5 first, immediate result.',
    },
    {
      sector: isFr ? "Cabinet d'avocats · Genève" : 'Law firm · Geneva',
      url: 'lex-partners.ch',
      before: 38,
      after: 81,
      win: isFr ? '3 H1 → 1 H1' : '3 H1s → 1 H1',
      quote: isFr
        ? 'Site refait en 10 jours. Le rapport PDF a servi de cahier des charges.'
        : 'Rebuilt in 10 days. The PDF report became the spec.',
    },
    {
      sector: isFr ? 'E-commerce · Neuchâtel' : 'E-commerce · Neuchâtel',
      url: 'horloges-direct.ch',
      before: 64,
      after: 89,
      win: isFr ? '52 images sans alt → 0' : '52 images missing alt → 0',
      quote: isFr
        ? 'Les alt générés par IA, revus à la main. Gain SEO + accessibilité.'
        : 'AI-generated alts, manually reviewed. SEO + accessibility win.',
    },
    {
      sector: isFr ? 'ONG · Lausanne' : 'NGO · Lausanne',
      url: 'fondation-climat.ch',
      before: 49,
      after: 86,
      win: isFr ? 'Flesch 34 → 68' : 'Flesch 34 → 68',
      quote: isFr
        ? 'Phrases plus courtes, structure plus claire. Le don moyen a augmenté de 22%.'
        : 'Shorter sentences, clearer structure. Average donation up 22%.',
    },
  ];

  return (
    <Shell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        <div
          className="mono caption-red"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-red)',
            marginBottom: 20,
          }}
        >
          § {isFr ? 'Exemples' : 'Examples'}
        </div>

        <DisplayTitle
          parts={[
            isFr ? 'Six audits,' : 'Six audits,',
            ['six', { red: ' deltas' }, { red: '.' }],
          ]}
          size="page"
        />

        <p
          style={{
            fontSize: 20,
            color: 'var(--sa-ink-2)',
            marginTop: 28,
            maxWidth: 640,
            lineHeight: 1.5,
          }}
        >
          {isFr
            ? 'Des sites réels, anonymisés ou non. Avant / après, chiffres bruts, ce qui a vraiment changé.'
            : 'Real sites, anonymised or not. Before / after, raw numbers, what actually changed.'}
        </p>

        <div
          style={{
            marginTop: 56,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 0,
            border: '2px solid var(--sa-ink)',
          }}
        >
          {cases.map((c, i) => {
            const delta = c.after - c.before;
            return (
              <div
                key={c.url}
                style={{
                  background: 'var(--sa-cream)',
                  padding: 28,
                  borderRight: i % 3 !== 2 ? '1px solid var(--sa-rule)' : 0,
                  borderBottom: i < 3 ? '1px solid var(--sa-rule)' : 0,
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--sa-ink-4)',
                    marginBottom: 8,
                  }}
                >
                  {c.sector}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--sa-font-mono)',
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 24,
                    color: 'var(--sa-ink)',
                  }}
                >
                  {c.url}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: 12,
                    alignItems: 'end',
                    marginBottom: 20,
                    padding: '16px 0',
                    borderTop: '1px solid var(--sa-rule)',
                    borderBottom: '1px solid var(--sa-rule)',
                  }}
                >
                  <div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        color: 'var(--sa-ink-4)',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {isFr ? 'Avant' : 'Before'}
                    </div>
                    <div
                      className="display tnum"
                      style={{ fontSize: 40, color: scoreColor(c.before), lineHeight: 1 }}
                    >
                      {c.before}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--sa-font-mono)',
                      fontSize: 24,
                      color: 'var(--sa-ink-3)',
                      paddingBottom: 8,
                    }}
                  >
                    →
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: '0.12em',
                        color: 'var(--sa-ink-4)',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {isFr ? 'Après' : 'After'}
                    </div>
                    <div
                      className="display tnum"
                      style={{ fontSize: 56, color: scoreColor(c.after), lineHeight: 1 }}
                    >
                      {c.after}
                    </div>
                  </div>
                </div>

                <div
                  className="mono"
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '4px 8px',
                    background: 'var(--sa-ink)',
                    color: 'var(--sa-cream)',
                    marginBottom: 14,
                  }}
                >
                  +{delta} · {c.win}
                </div>

                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--sa-ink-3)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  « {c.quote} »
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}
