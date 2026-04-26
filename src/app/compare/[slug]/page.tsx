'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import { Pixel } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';
import {
  getCompareBySlug,
  formatCompareDate,
  pickH1,
  pickLead,
  pickTldr,
  pickCategory,
  pickBody,
  pickRowDimension,
  pickRowSwissalytics,
  pickRowCompetitor,
  pickWhenItemTitle,
  pickWhenItemBody,
  pickFaqQ,
  pickFaqA,
  type ComparePage,
} from '@/lib/compare/pages';

// ────────────────────────────────────────────────────────────────
// Verdict pill — sa-wins / tie / competitor-wins
// ────────────────────────────────────────────────────────────────
function VerdictPill({
  verdict,
  isFr,
}: {
  verdict?: 'sa-wins' | 'tie' | 'competitor-wins';
  isFr: boolean;
}) {
  if (!verdict) return null;
  const cfg = {
    'sa-wins': {
      label: 'Swissalytics',
      bg: 'var(--sa-red)',
      fg: 'var(--sa-cream)',
    },
    tie: {
      label: isFr ? 'Égalité' : 'Tie',
      bg: 'var(--sa-cream-2)',
      fg: 'var(--sa-ink)',
    },
    'competitor-wins': {
      label: isFr ? 'Concurrent' : 'Competitor',
      bg: 'var(--sa-ink)',
      fg: 'var(--sa-cream)',
    },
  }[verdict];
  return (
    <span
      className="mono"
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        background: cfg.bg,
        color: cfg.fg,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        border: '1px solid var(--sa-ink)',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}

// ────────────────────────────────────────────────────────────────
// FAQ JSON-LD — extracted by AI Overviews
// ────────────────────────────────────────────────────────────────
function FaqJsonLd({ page, isFr }: { page: ComparePage; isFr: boolean }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((f) => ({
      '@type': 'Question',
      name: pickFaqQ(f, isFr),
      acceptedAnswer: {
        '@type': 'Answer',
        text: pickFaqA(f, isFr),
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ────────────────────────────────────────────────────────────────
// Article JSON-LD — for citations
// ────────────────────────────────────────────────────────────────
function ArticleJsonLd({ page, isFr }: { page: ComparePage; isFr: boolean }) {
  const url = `https://swissalytics.com/compare/${page.slug}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: pickH1(page, isFr),
    description: isFr ? page.metaDescription : page.metaDescriptionEn ?? page.metaDescription,
    url,
    datePublished: page.date,
    dateModified: page.updated,
    author: {
      '@type': 'Organization',
      name: 'Pixelab',
      url: 'https://pixelab.ch',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Swissalytics',
      url: 'https://swissalytics.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://swissalytics.com/logo-mark.svg',
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    about: [
      { '@type': 'Thing', name: 'Swissalytics', url: 'https://swissalytics.com' },
      { '@type': 'Thing', name: page.competitor, url: page.competitorUrl },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────
export default function ComparePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { lang } = useTheme();
  const isFr = lang === 'fr';

  const page = getCompareBySlug(slug);

  // ── Not found ──
  if (!page) {
    return (
      <Shell>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 24px' }}>
          <div
            className="mono caption-red"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--sa-red)',
              marginBottom: 20,
            }}
          >
            § 404
          </div>
          <h1
            className="display"
            style={{
              fontSize: 'clamp(32px, 4.4vw, 52px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.02,
              margin: 0,
              color: 'var(--sa-ink)',
            }}
          >
            {isFr ? 'Comparatif introuvable' : 'Comparison not found'}
            <Pixel />
          </h1>
          <p
            style={{
              fontSize: 18,
              color: 'var(--sa-ink-3)',
              marginTop: 20,
              lineHeight: 1.55,
            }}
          >
            {isFr
              ? "Ce comparatif n'existe pas ou a été retiré."
              : "This comparison does not exist or has been retired."}
          </p>
          <div style={{ marginTop: 32 }}>
            <Link
              href="/compare"
              className="mono"
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--sa-ink)',
                textDecoration: 'none',
                borderBottom: '2px solid var(--sa-red)',
                paddingBottom: 2,
              }}
            >
              ← {isFr ? 'Tous les comparatifs' : 'All comparisons'}
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const h1 = pickH1(page, isFr);
  const lead = pickLead(page, isFr);
  const tldr = pickTldr(page, isFr);
  const category = pickCategory(page, isFr);
  const body = pickBody(page, isFr);

  return (
    <Shell>
      <FaqJsonLd page={page} isFr={isFr} />
      <ArticleJsonLd page={page} isFr={isFr} />

      <div style={{ maxWidth: 920, margin: '0 auto', padding: '64px 24px' }}>
        {/* ──────────────────────────
            Breadcrumb
           ────────────────────────── */}
        <nav
          className="mono"
          aria-label="Breadcrumb"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--sa-ink-4)',
            marginBottom: 32,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={{ color: 'var(--sa-ink-4)', textDecoration: 'none' }}>
            Swissalytics
          </Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <Link href="/compare" style={{ color: 'var(--sa-ink-4)', textDecoration: 'none' }}>
            {isFr ? 'Comparatifs' : 'Comparisons'}
          </Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--sa-ink)' }}>{page.competitor}</span>
        </nav>

        {/* ──────────────────────────
            Header — vs panel
           ────────────────────────── */}
        <header
          style={{
            border: '2px solid var(--sa-ink)',
            marginBottom: 48,
          }}
        >
          {/* Top kicker bar */}
          <div
            className="mono"
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--sa-ink-4)',
              padding: '12px 24px',
              borderBottom: '1px solid var(--sa-rule)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <span>{isFr ? 'Comparatif' : 'Comparison'} · {category}</span>
            <span>
              {isFr ? 'Mis à jour' : 'Updated'}{' '}
              {formatCompareDate(page.updated, lang)}
            </span>
          </div>

          {/* vs panels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'stretch',
            }}
          >
            {/* Swissalytics panel */}
            <div
              style={{
                background: 'var(--sa-cream)',
                padding: '32px 28px',
                borderRight: '1px solid var(--sa-rule)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-red)',
                }}
              >
                ★ {isFr ? 'Notre outil' : 'Our tool'}
              </div>
              <div
                className="display"
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: 'var(--sa-ink)',
                }}
              >
                Swissalytics
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-4)',
                }}
              >
                {isFr ? 'Audit GEO · Genève · Gratuit' : 'GEO audit · Geneva · Free'}
              </div>
            </div>

            {/* vs separator */}
            <div
              style={{
                background: 'var(--sa-ink)',
                color: 'var(--sa-cream)',
                padding: '0 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="display"
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  fontFamily: 'var(--sa-font-sans)',
                }}
              >
                VS
              </span>
            </div>

            {/* Competitor panel */}
            <div
              style={{
                background: 'var(--sa-cream-2)',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
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
                }}
              >
                {isFr ? 'Concurrent' : 'Competitor'}
              </div>
              <div
                className="display"
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: 'var(--sa-ink)',
                }}
              >
                {page.competitor}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-4)',
                }}
              >
                {category} · {page.competitorHq}
              </div>
            </div>
          </div>

          {/* H1 strip */}
          <div
            style={{
              borderTop: '2px solid var(--sa-ink)',
              padding: '40px 28px',
              background: 'var(--sa-cream)',
            }}
          >
            <h1
              className="display"
              style={{
                fontSize: 'clamp(36px, 5.4vw, 60px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                margin: 0,
                textWrap: 'balance',
                color: 'var(--sa-ink)',
              }}
            >
              {h1}
              <Pixel />
            </h1>
            <p
              style={{
                fontFamily: 'var(--sa-font-sans)',
                fontSize: 19,
                color: 'var(--sa-ink-2)',
                marginTop: 24,
                marginBottom: 0,
                lineHeight: 1.5,
                textWrap: 'pretty',
                maxWidth: 720,
              }}
              dangerouslySetInnerHTML={{ __html: lead }}
            />
          </div>
        </header>

        {/* ──────────────────────────
            TL;DR — black box
           ────────────────────────── */}
        <div
          style={{
            background: 'var(--sa-ink)',
            color: 'var(--sa-cream)',
            padding: '28px 32px',
            border: '2px solid var(--sa-ink)',
            marginBottom: 56,
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: 24,
            alignItems: 'start',
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--sa-red)',
              whiteSpace: 'nowrap',
            }}
          >
            § TL;DR
          </div>
          <div
            style={{
              fontFamily: 'var(--sa-font-sans)',
              fontSize: 19,
              fontWeight: 600,
              lineHeight: 1.45,
              color: 'var(--sa-cream)',
              textWrap: 'pretty',
            }}
          >
            {tldr}
            <Pixel />
          </div>
        </div>

        {/* ──────────────────────────
            Comparison table
           ────────────────────────── */}
        <section style={{ marginBottom: 72 }}>
          <div
            className="mono caption-red"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--sa-red)',
              marginBottom: 16,
            }}
          >
            § {isFr ? 'Comparatif détaillé' : 'Detailed comparison'}
          </div>
          <h2
            className="display"
            style={{
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              margin: '0 0 28px 0',
              color: 'var(--sa-ink)',
            }}
          >
            {isFr
              ? `Swissalytics et ${page.competitor}, dimension par dimension.`
              : `Swissalytics and ${page.competitor}, side by side.`}
            <Pixel />
          </h2>

          <div
            style={{
              border: '2px solid var(--sa-ink)',
              overflow: 'hidden',
            }}
          >
            {/* Table header */}
            <div
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.3fr 1.5fr 1.5fr 160px',
                background: 'var(--sa-ink)',
                color: 'var(--sa-cream)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              <div style={{ padding: '14px 16px' }}>
                {isFr ? 'Dimension' : 'Dimension'}
              </div>
              <div
                style={{
                  padding: '14px 16px',
                  borderLeft: '1px solid rgba(255,255,255,0.18)',
                  color: 'var(--sa-red)',
                }}
              >
                Swissalytics
              </div>
              <div
                style={{
                  padding: '14px 16px',
                  borderLeft: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                {page.competitor}
              </div>
              <div
                style={{
                  padding: '14px 12px',
                  borderLeft: '1px solid rgba(255,255,255,0.18)',
                  textAlign: 'center',
                }}
              >
                {isFr ? 'Verdict' : 'Verdict'}
              </div>
            </div>

            {/* Table rows */}
            {page.rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.3fr 1.5fr 1.5fr 160px',
                  borderTop: i === 0 ? '0' : '1px solid var(--sa-rule)',
                  background:
                    i % 2 === 0 ? 'var(--sa-cream)' : 'var(--sa-cream-2)',
                  alignItems: 'center',
                }}
              >
                <div
                  className="mono"
                  style={{
                    padding: '18px 16px',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    color: 'var(--sa-ink)',
                  }}
                >
                  {pickRowDimension(r, isFr)}
                </div>
                <div
                  style={{
                    padding: '18px 16px',
                    fontSize: 14,
                    color: 'var(--sa-ink)',
                    borderLeft: '1px solid var(--sa-rule)',
                    lineHeight: 1.45,
                  }}
                >
                  {pickRowSwissalytics(r, isFr)}
                </div>
                <div
                  style={{
                    padding: '18px 16px',
                    fontSize: 14,
                    color: 'var(--sa-ink-2)',
                    borderLeft: '1px solid var(--sa-rule)',
                    lineHeight: 1.45,
                  }}
                >
                  {pickRowCompetitor(r, isFr)}
                </div>
                <div
                  style={{
                    padding: '18px 12px',
                    borderLeft: '1px solid var(--sa-rule)',
                    textAlign: 'center',
                  }}
                >
                  <VerdictPill verdict={r.verdict} isFr={isFr} />
                </div>
              </div>
            ))}
          </div>

          <div
            className="mono"
            style={{
              marginTop: 12,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--sa-ink-4)',
            }}
          >
            {isFr
              ? 'Pill = qui a l\'avantage sur cette dimension'
              : 'Pill = who has the edge on this dimension'}
          </div>
        </section>

        {/* ──────────────────────────
            When to choose — two columns
           ────────────────────────── */}
        <section style={{ marginBottom: 72 }}>
          <div
            className="mono caption-red"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--sa-red)',
              marginBottom: 16,
            }}
          >
            § {isFr ? 'Quel outil choisir' : 'Which tool to choose'}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 0,
              border: '2px solid var(--sa-ink)',
            }}
          >
            {/* Choose Swissalytics */}
            <div
              style={{
                padding: '32px 28px',
                background: 'var(--sa-cream)',
                borderRight: '1px solid var(--sa-rule)',
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
                  marginBottom: 12,
                }}
              >
                ★ {isFr ? 'Choisir Swissalytics si' : 'Choose Swissalytics if'}
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                }}
              >
                {page.whenSwissalytics.map((it, i) => (
                  <li
                    key={i}
                    style={{
                      padding: '16px 0',
                      borderTop:
                        i === 0 ? '0' : '1px solid var(--sa-rule)',
                    }}
                  >
                    <div
                      className="display"
                      style={{
                        fontFamily: 'var(--sa-font-sans)',
                        fontSize: 17,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.25,
                        color: 'var(--sa-ink)',
                        marginBottom: 6,
                      }}
                    >
                      {pickWhenItemTitle(it, isFr)}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: 'var(--sa-ink-2)',
                        lineHeight: 1.5,
                      }}
                    >
                      {pickWhenItemBody(it, isFr)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Choose Competitor */}
            <div
              style={{
                padding: '32px 28px',
                background: 'var(--sa-cream-2)',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-4)',
                  marginBottom: 12,
                }}
              >
                {isFr
                  ? `Choisir ${page.competitor} si`
                  : `Choose ${page.competitor} if`}
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                }}
              >
                {page.whenCompetitor.map((it, i) => (
                  <li
                    key={i}
                    style={{
                      padding: '16px 0',
                      borderTop:
                        i === 0 ? '0' : '1px solid var(--sa-rule)',
                    }}
                  >
                    <div
                      className="display"
                      style={{
                        fontFamily: 'var(--sa-font-sans)',
                        fontSize: 17,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.25,
                        color: 'var(--sa-ink)',
                        marginBottom: 6,
                      }}
                    >
                      {pickWhenItemTitle(it, isFr)}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: 'var(--sa-ink-2)',
                        lineHeight: 1.5,
                      }}
                    >
                      {pickWhenItemBody(it, isFr)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ──────────────────────────
            Body sections — analysis
           ────────────────────────── */}
        <article
          style={{
            fontFamily: 'var(--sa-font-sans)',
            fontSize: 17,
            lineHeight: 1.65,
            color: 'var(--sa-ink)',
            marginBottom: 72,
          }}
        >
          {body.map((b, i) => {
            if (b.type === 'h2') {
              return (
                <h2
                  key={i}
                  className="display"
                  style={{
                    fontFamily: 'var(--sa-font-sans)',
                    fontSize: 32,
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    margin: '48px 0 18px 0',
                    lineHeight: 1.1,
                    color: 'var(--sa-ink)',
                  }}
                >
                  {b.text}
                </h2>
              );
            }
            if (b.type === 'p') {
              return (
                <p
                  key={i}
                  style={{ margin: '0 0 20px 0' }}
                  dangerouslySetInnerHTML={{ __html: b.html }}
                />
              );
            }
            if (b.type === 'quote') {
              return (
                <blockquote
                  key={i}
                  style={{
                    margin: '40px 0',
                    padding: '28px 28px 28px 32px',
                    borderLeft: '4px solid var(--sa-red)',
                    background: 'var(--sa-cream-2)',
                    fontFamily: 'var(--sa-font-sans)',
                    fontSize: 21,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    color: 'var(--sa-ink)',
                    textWrap: 'pretty',
                  }}
                >
                  {b.text}
                </blockquote>
              );
            }
            return null;
          })}
        </article>

        {/* ──────────────────────────
            FAQ — accordion
           ────────────────────────── */}
        <section style={{ marginBottom: 72 }}>
          <div
            className="mono caption-red"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--sa-red)',
              marginBottom: 16,
            }}
          >
            § FAQ
          </div>
          <h2
            className="display"
            style={{
              fontSize: 'clamp(28px, 3.6vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              margin: '0 0 28px 0',
              color: 'var(--sa-ink)',
            }}
          >
            {isFr ? 'Questions fréquentes.' : 'Frequently asked questions.'}
            <Pixel />
          </h2>

          <div style={{ border: '2px solid var(--sa-ink)' }}>
            {page.faq.map((f, i) => (
              <FaqItem key={i} q={pickFaqQ(f, isFr)} a={pickFaqA(f, isFr)} idx={i} />
            ))}
          </div>
        </section>

        {/* ──────────────────────────
            CTA — analyze my site
           ────────────────────────── */}
        <div
          style={{
            border: '2px solid var(--sa-ink)',
            background: 'var(--sa-cream-2)',
            padding: '36px 32px',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              className="mono caption-red"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--sa-red)',
                marginBottom: 8,
              }}
            >
              § {isFr ? 'Tester mon site' : 'Test my site'}
            </div>
            <div
              className="display"
              style={{
                fontSize: 'clamp(22px, 2.6vw, 28px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: 'var(--sa-ink)',
              }}
            >
              {isFr
                ? 'Votre URL, 30 secondes, gratuit.'
                : 'Your URL, 30 seconds, free.'}
              <Pixel />
            </div>
          </div>
          <Link
            href="/"
            style={{
              padding: '14px 24px',
              background: 'var(--sa-red)',
              color: 'var(--sa-cream)',
              border: '2px solid var(--sa-ink)',
              fontFamily: 'var(--sa-font-sans)',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            {isFr ? "Lancer l'analyse →" : 'Launch audit →'}
          </Link>
        </div>

        {/* ──────────────────────────
            Back to /compare
           ────────────────────────── */}
        <div style={{ marginTop: 48, textAlign: 'center' }}>
          <Link
            href="/compare"
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--sa-ink-4)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--sa-ink-4)',
              paddingBottom: 2,
            }}
          >
            ← {isFr ? 'Tous les comparatifs' : 'All comparisons'}
          </Link>
        </div>
      </div>
    </Shell>
  );
}

// ────────────────────────────────────────────────────────────────
// FaqItem — collapsible
// ────────────────────────────────────────────────────────────────
function FaqItem({ q, a, idx }: { q: string; a: string; idx: number }) {
  const [open, setOpen] = useState(idx === 0);
  return (
    <div style={{ borderTop: idx === 0 ? '0' : '1px solid var(--sa-rule)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%',
          padding: '20px 24px',
          background: open ? 'var(--sa-cream)' : 'transparent',
          border: 0,
          textAlign: 'left',
          cursor: 'pointer',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 20,
          alignItems: 'center',
          fontFamily: 'var(--sa-font-sans)',
        }}
      >
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--sa-ink)',
            letterSpacing: '-0.01em',
            lineHeight: 1.3,
          }}
        >
          {q}
        </div>
        <div
          className="mono"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--sa-red)',
            width: 24,
            textAlign: 'center',
          }}
        >
          {open ? '−' : '+'}
        </div>
      </button>
      {open && (
        <div
          style={{
            padding: '0 24px 24px 24px',
            fontFamily: 'var(--sa-font-sans)',
            fontSize: 16,
            lineHeight: 1.6,
            color: 'var(--sa-ink-2)',
            textWrap: 'pretty',
            background: 'var(--sa-cream)',
          }}
        >
          {a}
        </div>
      )}
    </div>
  );
}
