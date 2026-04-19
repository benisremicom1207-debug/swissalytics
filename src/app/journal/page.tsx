'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import { DisplayTitle, Pixel } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';
import {
  JOURNAL_POSTS,
  formatJournalDate,
  type JournalPost,
} from '@/lib/journal/posts';

function localizedTitle(p: JournalPost, isFr: boolean): string {
  return isFr ? p.title : p.titleEn ?? p.title;
}
function localizedExcerpt(p: JournalPost, isFr: boolean): string {
  return isFr ? p.excerpt : p.excerptEn ?? p.excerpt;
}
function localizedCat(p: JournalPost, isFr: boolean): string {
  return isFr ? p.category : p.categoryEn ?? p.category;
}
function localizedNumLabel(p: JournalPost, isFr: boolean): string {
  if (isFr) return p.featuredNumeralLabel ?? '';
  return p.featuredNumeralLabelEn ?? p.featuredNumeralLabel ?? '';
}

export default function JournalIndexPage() {
  const { lang } = useTheme();
  const isFr = lang === 'fr';

  // Sort newest first
  const posts = useMemo(
    () =>
      [...JOURNAL_POSTS].sort((a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
      ),
    [],
  );

  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== featured.slug);

  const cats = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const p of posts) {
      const c = localizedCat(p, isFr);
      if (!seen.has(c)) {
        seen.add(c);
        out.push(c);
      }
    }
    return out;
  }, [posts, isFr]);

  const allLabel = isFr ? 'Tout' : 'All';
  const [activeCat, setActiveCat] = useState<string>(allLabel);

  const visible =
    activeCat === allLabel
      ? rest
      : rest.filter((p) => localizedCat(p, isFr) === activeCat);

  // Edition number — stable-ish, based on total count
  const editionNum = String(posts.length).padStart(2, '0');

  return (
    <Shell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        {/* ────────────────────────────────────────────────
            Masthead — newspaper-style
           ──────────────────────────────────────────────── */}
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
            <span>Swissalytics · {isFr ? 'Le journal' : 'The journal'}</span>
            <span>
              {isFr ? 'Publié depuis Genève' : 'Published from Geneva'}
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
            § {isFr ? 'Journal' : 'Journal'}
          </div>

          <DisplayTitle
            parts={
              isFr
                ? ['Lire', ['pour se faire citer', { red: '.' }]]
                : ['Read', ['to get cited', { red: '.' }]]
            }
            size="page"
          />

          <p
            style={{
              fontSize: 20,
              color: 'var(--sa-ink-2)',
              marginTop: 24,
              maxWidth: 720,
              lineHeight: 1.5,
            }}
          >
            {isFr
              ? "Articles techniques, analyses, cas clients. On écrit ici ce qu'on aimerait que ChatGPT sache sur le web suisse."
              : 'Technical articles, analyses, case studies. We write here what we wish ChatGPT knew about the Swiss web.'}
          </p>
        </div>

        {/* ────────────────────────────────────────────────
            Featured article — thick ink frame, black numeral panel
           ──────────────────────────────────────────────── */}
        <Link
          href={`/journal/${featured.slug}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <article
            className="sa-rise"
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
              gap: 0,
              border: '2px solid var(--sa-ink)',
              cursor: 'pointer',
              marginBottom: 72,
            }}
          >
            <div
              style={{
                padding: '40px 36px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 360,
                background: 'var(--sa-cream)',
              }}
            >
              <div>
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--sa-red)',
                    marginBottom: 20,
                  }}
                >
                  ★ {isFr ? 'À la une' : 'Featured'} ·{' '}
                  {localizedCat(featured, isFr)}
                </div>
                <h2
                  className="display"
                  style={{
                    fontSize: 'clamp(32px, 4.4vw, 56px)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.02,
                    margin: 0,
                    textWrap: 'balance',
                    color: 'var(--sa-ink)',
                  }}
                >
                  {localizedTitle(featured, isFr)}
                </h2>
                <p
                  style={{
                    fontSize: 17,
                    color: 'var(--sa-ink-3)',
                    marginTop: 24,
                    lineHeight: 1.55,
                    textWrap: 'pretty',
                    maxWidth: 520,
                  }}
                >
                  {localizedExcerpt(featured, isFr)}
                </p>
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-4)',
                  display: 'flex',
                  gap: 14,
                  marginTop: 32,
                  flexWrap: 'wrap',
                }}
              >
                <span>{formatJournalDate(featured.date, lang)}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>
                  {featured.readTime} min {isFr ? 'de lecture' : 'read'}
                </span>
                <span style={{ marginLeft: 'auto', color: 'var(--sa-red)' }}>
                  {isFr ? 'Lire →' : 'Read →'}
                </span>
              </div>
            </div>

            {/* Black panel with giant numeral */}
            <div
              style={{
                background: 'var(--sa-ink)',
                color: 'var(--sa-cream)',
                padding: '40px 36px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  opacity: 0.6,
                  color: 'var(--sa-cream)',
                }}
              >
                {isFr ? "L'article" : 'The article'}
              </div>
              <div
                style={{
                  fontFamily: 'var(--sa-font-sans)',
                  fontSize: 'clamp(120px, 16vw, 220px)',
                  fontWeight: 800,
                  lineHeight: 0.85,
                  letterSpacing: '-0.06em',
                  color: 'var(--sa-cream)',
                  alignSelf: 'flex-start',
                }}
              >
                {featured.featuredNumeral ?? '01'}
                <Pixel />
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-cream)',
                  opacity: 0.7,
                  textAlign: 'right',
                }}
              >
                {localizedNumLabel(featured, isFr) ||
                  (isFr ? 'À lire' : 'Read now')}
              </div>
            </div>
          </article>
        </Link>

        {/* ────────────────────────────────────────────────
            Filter bar — category chips
           ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            gap: 0,
            alignItems: 'baseline',
            borderBottom: '2px solid var(--sa-ink)',
            marginBottom: 0,
            paddingBottom: 14,
            flexWrap: 'wrap',
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
              marginRight: 20,
            }}
          >
            {isFr ? 'Filtrer' : 'Filter'}
          </div>
          {[allLabel, ...cats].map((c) => {
            const active = activeCat === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCat(c)}
                style={{
                  padding: '8px 14px',
                  border: 0,
                  background: 'transparent',
                  fontFamily: 'var(--sa-font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: active ? 'var(--sa-ink)' : 'var(--sa-ink-4)',
                  borderBottom: active
                    ? '2px solid var(--sa-red)'
                    : '2px solid transparent',
                  marginBottom: -14,
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            );
          })}
          <div
            className="mono"
            style={{
              marginLeft: 'auto',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--sa-ink-4)',
            }}
          >
            {visible.length} {isFr ? 'articles' : 'posts'}
          </div>
        </div>

        {/* ────────────────────────────────────────────────
            Article list — newspaper rows
           ──────────────────────────────────────────────── */}
        <div>
          {visible.map((p) => {
            const idx = posts.indexOf(p) + 1;
            return (
              <Link
                key={p.slug}
                href={`/journal/${p.slug}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <article
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 140px 120px',
                    gap: 24,
                    padding: '28px 12px',
                    borderBottom: '1px solid var(--sa-rule)',
                    alignItems: 'start',
                    cursor: 'pointer',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--sa-cream-2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div
                    className="display tnum"
                    style={{
                      fontSize: 40,
                      fontWeight: 800,
                      color: 'var(--sa-ink)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1,
                    }}
                  >
                    {String(idx).padStart(2, '0')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--sa-red)',
                        marginBottom: 10,
                      }}
                    >
                      {localizedCat(p, isFr)}
                    </div>
                    <h3
                      className="display"
                      style={{
                        fontSize: 'clamp(22px, 2.4vw, 30px)',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        margin: '0 0 10px 0',
                        color: 'var(--sa-ink)',
                        textWrap: 'balance',
                      }}
                    >
                      {localizedTitle(p, isFr)}
                    </h3>
                    <p
                      style={{
                        fontSize: 15,
                        color: 'var(--sa-ink-3)',
                        margin: 0,
                        lineHeight: 1.5,
                        textWrap: 'pretty',
                        maxWidth: 620,
                      }}
                    >
                      {localizedExcerpt(p, isFr)}
                    </p>
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
                    {formatJournalDate(p.date, lang)}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: 'var(--sa-ink-4)',
                      textAlign: 'right',
                    }}
                  >
                    {p.readTime} min
                  </div>
                </article>
              </Link>
            );
          })}

          {visible.length === 0 && (
            <div
              className="mono"
              style={{
                padding: '48px 12px',
                fontSize: 12,
                color: 'var(--sa-ink-4)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {isFr
                ? 'Aucun article dans cette catégorie.'
                : 'No posts in this category.'}
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────
            RSS block
           ──────────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 72,
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
              § RSS
            </div>
            <h3
              className="display"
              style={{
                fontSize: 'clamp(24px, 3vw, 34px)',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              {isFr
                ? 'Pas de newsletter, juste un flux RSS'
                : 'No newsletter, just an RSS feed'}
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
                ? "On ne veut pas votre email. Abonnez-vous au flux, on publie environ un article par semaine."
                : "We don't want your email. Subscribe to the feed, we publish about one article per week."}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <a
              href="/feed.xml"
              style={{
                padding: '12px 20px',
                background: 'var(--sa-ink)',
                color: 'var(--sa-cream)',
                border: 0,
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
              /feed.xml
            </a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
