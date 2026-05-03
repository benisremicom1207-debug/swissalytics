'use client';

import React from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import { DisplayTitle, Pixel } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';

type Column = {
  n: string;
  k: string;
  body: React.ReactNode;
};

type Stat = {
  n: string;
  l: string;
};

export default function AProposPage() {
  const { lang } = useTheme();
  const isFr = lang === 'fr';

  const columns: Column[] = [
    {
      n: '01',
      k: isFr ? 'Qui' : 'Who',
      body: isFr ? (
        <>
          Pixelab, fondé en <b>2020</b> à Genève. Une poignée d&apos;obsédés du web qui construisent
          des sites, des outils, et des marques pour des entreprises suisses.
        </>
      ) : (
        <>
          Pixelab, founded in <b>2020</b> in Geneva. A handful of web-obsessed people who build
          sites, tools, and brands for Swiss companies.
        </>
      ),
    },
    {
      n: '02',
      k: isFr ? 'Où' : 'Where',
      body: isFr ? (
        <>
          Genève. Serveurs chez <b>Infomaniak</b>, à 12 minutes à pied du bureau. Si ça tombe, on
          sait qui appeler.
        </>
      ) : (
        <>
          Geneva. Servers at <b>Infomaniak</b>, 12 minutes on foot from the office. If it breaks,
          we know who to call.
        </>
      ),
    },
    {
      n: '03',
      k: isFr ? 'Pourquoi' : 'Why',
      body: isFr ? (
        <>
          Les outils d&apos;audit SEO existants sont chers, américains, et ignorent que les gens
          demandent maintenant à <b>ChatGPT</b>, pas à Google.
        </>
      ) : (
        <>
          Existing SEO tools are expensive, American, and ignore that people now ask{' '}
          <b>ChatGPT</b>, not Google.
        </>
      ),
    },
  ];

  const stats: Stat[] = [
    { n: '2020', l: isFr ? 'Création · Genève' : 'Founded · Geneva' },
    { n: '120+', l: isFr ? 'Projets livrés' : 'Projects shipped' },
    { n: '100 %', l: isFr ? 'Hébergement suisse' : 'Swiss hosting' },
    { n: 'CHF 0', l: isFr ? 'Prix de Swissalytics' : 'Price of Swissalytics' },
  ];

  return (
    <Shell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        {/* Section kicker */}
        <div
          className="mono caption-red"
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-red)',
            marginBottom: 20,
            marginTop: 12,
          }}
        >
          § {isFr ? 'À propos' : 'About'}
        </div>

        <DisplayTitle
          parts={
            isFr
              ? ['Fait par ', ['Pixelab', { red: '.' }]]
              : ['Made by ', ['Pixelab', { red: '.' }]]
          }
          size="page"
        />

        <p
          style={{
            fontSize: 'clamp(22px, 2.2vw, 30px)',
            color: 'var(--sa-ink-2)',
            marginTop: 32,
            maxWidth: 820,
            lineHeight: 1.4,
            fontWeight: 500,
            textWrap: 'pretty',
          }}
        >
          {isFr ? (
            <>
              Swissalytics est un outil <b>gratuit</b> fait par <b>Pixelab</b>, agence web
              genevoise depuis <b>2020</b>. Parce qu&apos;on en avait marre de voir nos clients
              passer à côté de <b>ChatGPT</b>.
            </>
          ) : (
            <>
              Swissalytics is a <b>free</b> tool by <b>Pixelab</b>, a Geneva web agency since{' '}
              <b>2020</b>. Because we got tired of watching our clients get ignored by{' '}
              <b>ChatGPT</b>.
            </>
          )}
        </p>

        {/* Three-column editorial slab */}
        <div
          style={{
            marginTop: 80,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderTop: '2px solid var(--sa-ink)',
            borderBottom: '2px solid var(--sa-ink)',
          }}
        >
          {columns.map((c, i) => (
            <div
              key={c.n}
              style={{
                padding: '36px 32px',
                borderLeft: i === 0 ? 0 : '1px solid var(--sa-rule)',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  color: 'var(--sa-red)',
                  textTransform: 'uppercase',
                  marginBottom: 14,
                }}
              >
                §{c.n} · {c.k}
              </div>
              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: 'var(--sa-ink-2)',
                  textWrap: 'pretty',
                }}
              >
                {c.body}
              </div>
            </div>
          ))}
        </div>

        {/* Editorial manifesto */}
        <div
          style={{
            marginTop: 80,
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: 48,
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--sa-red)',
                marginBottom: 12,
              }}
            >
              § {isFr ? 'Le contexte' : 'Context'}
            </div>
            <h2
              className="display"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              {isFr ? 'Le web change' : 'The web is changing'}
              <Pixel />
            </h2>
          </div>
          <div
            style={{
              fontFamily: 'var(--sa-font-serif)',
              fontStyle: 'italic',
              fontSize: 19,
              lineHeight: 1.7,
              color: 'var(--sa-ink-2)',
              textWrap: 'pretty',
            }}
          >
            <p style={{ margin: '0 0 18px 0' }}>
              {isFr ? (
                <>
                  Chez Pixelab, on regarde nos clients depuis cinq ans. Quelque chose a changé
                  vers fin 2023 : le trafic Google devient plat, les conversions stagnent, mais
                  les mentions « j&apos;ai entendu parler de vous par ChatGPT » explosent.
                </>
              ) : (
                <>
                  At Pixelab, we&apos;ve been watching our clients for five years. Something
                  changed in late 2023: Google traffic flattened, conversions stagnated, but
                  &ldquo;I heard about you from ChatGPT&rdquo; mentions exploded.
                </>
              )}
            </p>
            <p style={{ margin: '0 0 18px 0' }}>
              {isFr ? (
                <>
                  Les règles du jeu ne sont plus les mêmes. Google indexait des pages ; ChatGPT
                  cite des phrases. Ce qui rend un site visible dans une IA n&apos;est pas ce qui
                  le rend visible dans un moteur de recherche.
                </>
              ) : (
                <>
                  The rules of the game have changed. Google indexed pages; ChatGPT cites
                  sentences. What makes a site visible to an AI is not what makes it visible to a
                  search engine.
                </>
              )}
            </p>
            <p style={{ margin: 0 }}>
              {isFr ? (
                <>
                  Swissalytics, c&apos;est notre tentative d&apos;en tirer un outil. Gratuit,
                  suisse, en trente secondes. Parce que la plupart de nos clients n&apos;ont pas
                  envie de payer 200 $ par mois à un outil américain pour apprendre qu&apos;il
                  leur manque un schéma{' '}
                  <span
                    className="mono"
                    style={{ fontSize: 15, fontStyle: 'normal' }}
                  >
                    Organization
                  </span>
                  .
                </>
              ) : (
                <>
                  Swissalytics is our attempt at turning that into a tool. Free, Swiss, in thirty
                  seconds. Because most of our clients don&apos;t want to pay $200/month to an
                  American tool to learn they&apos;re missing an{' '}
                  <span
                    className="mono"
                    style={{ fontSize: 15, fontStyle: 'normal' }}
                  >
                    Organization
                  </span>{' '}
                  schema.
                </>
              )}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            marginTop: 96,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '2px solid var(--sa-ink)',
            borderBottom: '2px solid var(--sa-ink)',
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.n}
              style={{
                padding: '40px 28px',
                borderLeft: i === 0 ? 0 : '1px solid var(--sa-rule)',
              }}
            >
              <div
                className="display tnum"
                style={{
                  fontSize: 'clamp(42px, 5vw, 72px)',
                  fontWeight: 800,
                  color: 'var(--sa-ink)',
                  letterSpacing: '-0.04em',
                  lineHeight: 0.92,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.n}
              </div>
              <div
                className="mono"
                style={{
                  marginTop: 12,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-4)',
                }}
              >
                {s.l}
              </div>
            </div>
          ))}
        </div>

        {/* Privacy block */}
        <div
          style={{
            marginTop: 80,
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            gap: 48,
          }}
        >
          <div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--sa-red)',
                marginBottom: 12,
              }}
            >
              § {isFr ? 'Vie privée' : 'Privacy'}
            </div>
            <h2
              className="display"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.05,
                margin: 0,
              }}
            >
              {isFr ? 'Anonyme par défaut' : 'Anonymous by default'}
              <Pixel />
            </h2>
          </div>
          <div
            style={{
              fontSize: 17,
              lineHeight: 1.7,
              color: 'var(--sa-ink-2)',
              textWrap: 'pretty',
            }}
          >
            <p style={{ margin: '0 0 14px 0' }}>
              {isFr
                ? "Pas de compte requis. Pas de cookie de tracking. Aucun email ni nom collecté."
                : 'No account required. No tracking cookies. No email or name collected.'}
            </p>
            <p style={{ margin: '0 0 14px 0' }}>
              {isFr
                ? "À chaque analyse, nous enregistrons l'URL et quelques métadonnées techniques (pays, navigateur, IP pseudonymisée par HMAC-SHA-256). Conservation 180 jours, base de données à Zurich (Supabase)."
                : 'On each analysis, we store the URL and some technical metadata (country, browser, HMAC-SHA-256 pseudonymized IP). 180-day retention, database in Zurich (Supabase).'}
            </p>
            <p style={{ margin: 0 }}>
              {isFr ? 'Détail complet : ' : 'Full details: '}
              <Link
                href="/mentions-legales"
                style={{ color: 'var(--sa-ink)', textDecoration: 'underline' }}
              >
                {isFr ? 'mentions légales' : 'legal notice'}
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Dual CTA block */}
        <div
          style={{
            marginTop: 80,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 0,
            border: '2px solid var(--sa-ink)',
          }}
        >
          <div style={{ padding: '40px 32px', background: 'var(--sa-cream)' }}>
            <div
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--sa-ink-4)',
                marginBottom: 14,
              }}
            >
              {isFr ? "Utiliser l'outil" : 'Use the tool'}
            </div>
            <h3
              className="display"
              style={{
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: '0 0 10px 0',
                lineHeight: 1.05,
              }}
            >
              {isFr ? 'Auditer un site, gratuitement' : 'Audit a site, free'}
            </h3>
            <p
              style={{
                fontSize: 15,
                color: 'var(--sa-ink-3)',
                margin: '0 0 22px 0',
                lineHeight: 1.5,
              }}
            >
              {isFr ? "Entrez l'URL, c'est tout." : "Enter the URL, that's it."}
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '12px 22px',
                background: 'var(--sa-ink)',
                color: 'var(--sa-cream)',
                border: 0,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              {isFr ? 'Lancer →' : 'Launch →'}
            </Link>
          </div>
          <div
            style={{
              padding: '40px 32px',
              background: 'var(--sa-ink)',
              color: 'var(--sa-cream)',
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--sa-red)',
                marginBottom: 14,
              }}
            >
              {isFr ? 'Travailler avec nous' : 'Work with us'}
            </div>
            <h3
              className="display"
              style={{
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: '0 0 10px 0',
                lineHeight: 1.05,
                color: 'var(--sa-cream)',
              }}
            >
              {isFr ? 'Un projet web ? Pixelab.' : 'A web project? Pixelab.'}
            </h3>
            <p
              style={{
                fontSize: 15,
                color: 'var(--sa-cream)',
                opacity: 0.7,
                margin: '0 0 22px 0',
                lineHeight: 1.5,
              }}
            >
              {isFr ? 'Sites, outils, refontes, IA. Genève.' : 'Sites, tools, redesigns, AI. Geneva.'}
            </p>
            <a
              href="https://pixelab.ch"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-block',
                padding: '12px 22px',
                background: 'var(--sa-red)',
                color: 'var(--sa-cream)',
                border: 0,
                fontWeight: 800,
                fontSize: 13,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              pixelab.ch →
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
