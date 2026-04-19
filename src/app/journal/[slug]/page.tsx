'use client';

import { use } from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import { Pixel } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';
import {
  getPostBySlug,
  getRelatedPosts,
  formatJournalDate,
  type JournalPost,
  type JournalBlock,
} from '@/lib/journal/posts';

// ────────────────────────────────────────────────────────────────
// Localisation helpers
// ────────────────────────────────────────────────────────────────
function pickTitle(p: JournalPost, isFr: boolean): string {
  return isFr ? p.title : p.titleEn ?? p.title;
}
function pickExcerpt(p: JournalPost, isFr: boolean): string {
  return isFr ? p.excerpt : p.excerptEn ?? p.excerpt;
}
function pickCat(p: JournalPost, isFr: boolean): string {
  return isFr ? p.category : p.categoryEn ?? p.category;
}
function pickLead(p: JournalPost, isFr: boolean): string {
  return isFr ? p.lead : p.leadEn ?? p.lead;
}
function pickContent(p: JournalPost, isFr: boolean): JournalBlock[] {
  return isFr ? p.content : p.contentEn ?? p.content;
}

// ────────────────────────────────────────────────────────────────
// Body block renderer
// ────────────────────────────────────────────────────────────────
function BodyBlocks({ blocks }: { blocks: JournalBlock[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'h2') {
          return (
            <h2
              key={i}
              className="display"
              style={{
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: '48px 0 20px 0',
                lineHeight: 1.1,
                fontFamily: 'var(--sa-font-sans)',
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
                margin: '48px 0',
                padding: '32px 32px 32px 36px',
                borderLeft: '4px solid var(--sa-red)',
                background: 'var(--sa-cream-2)',
                fontFamily: 'var(--sa-font-serif)',
                fontSize: 26,
                fontStyle: 'italic',
                lineHeight: 1.3,
                color: 'var(--sa-ink)',
                textWrap: 'pretty',
              }}
            >
              {b.text}
            </blockquote>
          );
        }
        if (b.type === 'numbered') {
          return (
            <ol
              key={i}
              style={{
                margin: '32px 0',
                padding: 0,
                listStyle: 'none',
              }}
            >
              {b.items.map((item) => (
                <li
                  key={item.n}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr',
                    gap: 20,
                    padding: '20px 0',
                    borderTop: '1px solid var(--sa-rule)',
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'var(--sa-red)',
                      letterSpacing: '0.06em',
                    }}
                  >
                    §{item.n}
                  </div>
                  <div>
                    <div
                      className="display"
                      style={{
                        fontFamily: 'var(--sa-font-sans)',
                        fontSize: 22,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        marginBottom: 8,
                        color: 'var(--sa-ink)',
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 17,
                        color: 'var(--sa-ink-2)',
                        lineHeight: 1.5,
                        textWrap: 'pretty',
                      }}
                      dangerouslySetInnerHTML={{ __html: item.body }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          );
        }
        return null;
      })}
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// Page
// ────────────────────────────────────────────────────────────────
export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { lang } = useTheme();
  const isFr = lang === 'fr';

  const post = getPostBySlug(slug);

  // ── Not found — inline state, do not trigger notFound() ──
  if (!post) {
    return (
      <Shell>
        <div
          style={{
            maxWidth: 680,
            margin: '0 auto',
            padding: '64px 24px',
          }}
        >
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
            {isFr ? 'Article introuvable' : 'Article not found'}
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
              ? "Cet article n'existe pas ou a été retiré. Il a peut-être été renommé — jetez un œil au sommaire du journal."
              : "This article does not exist or has been retired. It may have been renamed — take a look at the journal index."}
          </p>
          <div style={{ marginTop: 32 }}>
            <Link
              href="/journal"
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
              ← {isFr ? 'Retour au journal' : 'Back to journal'}
            </Link>
          </div>
        </div>
      </Shell>
    );
  }

  const title = pickTitle(post, isFr);
  const excerpt = pickExcerpt(post, isFr);
  const category = pickCat(post, isFr);
  const lead = pickLead(post, isFr);
  const content = pickContent(post, isFr);
  const dropCap = (lead.match(/[A-Za-zÀ-ÿ]/)?.[0] ?? 'L').toUpperCase();
  // Remove the first letter from the lead — drop cap renders it separately
  const leadWithoutFirstChar = lead.replace(/^([^A-Za-zÀ-ÿ]*)[A-Za-zÀ-ÿ]/, '$1');

  const related = getRelatedPosts(post.slug, 3);

  return (
    <Shell>
      <div
        style={{
          maxWidth: 680,
          margin: '0 auto',
          padding: '64px 24px',
        }}
      >
        {/* ────────────────────────────────────────────
            Breadcrumb
           ──────────────────────────────────────────── */}
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
          <Link
            href="/"
            style={{ color: 'var(--sa-ink-4)', textDecoration: 'none' }}
          >
            Swissalytics
          </Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <Link
            href="/journal"
            style={{ color: 'var(--sa-ink-4)', textDecoration: 'none' }}
          >
            {isFr ? 'Journal' : 'Journal'}
          </Link>
          <span style={{ opacity: 0.5 }}>/</span>
          <span style={{ color: 'var(--sa-ink) ' }}>{category}</span>
        </nav>

        {/* ────────────────────────────────────────────
            Header — kicker, title, meta
           ──────────────────────────────────────────── */}
        <header
          style={{
            borderBottom: '2px solid var(--sa-ink)',
            paddingBottom: 28,
            marginBottom: 40,
          }}
        >
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
            § {category}
          </div>

          <h1
            className="display"
            style={{
              fontSize: 'clamp(36px, 5.8vw, 68px)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              margin: 0,
              textWrap: 'balance',
              color: 'var(--sa-ink)',
            }}
          >
            {title}
            <Pixel />
          </h1>

          <p
            style={{
              fontFamily: 'var(--sa-font-serif)',
              fontSize: 22,
              fontStyle: 'italic',
              color: 'var(--sa-ink-2)',
              marginTop: 28,
              lineHeight: 1.45,
              textWrap: 'pretty',
            }}
          >
            {excerpt}
          </p>

          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
              paddingTop: 18,
              borderTop: '1px solid var(--sa-rule)',
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--sa-ink)',
              }}
            >
              {post.author}
            </span>
            <span style={{ color: 'var(--sa-ink-4)' }}>·</span>
            <span
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--sa-ink-4)',
              }}
            >
              {formatJournalDate(post.date, lang)}
            </span>
            <span style={{ color: 'var(--sa-ink-4)' }}>·</span>
            <span
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--sa-ink-4)',
              }}
            >
              {post.readTime} min {isFr ? 'de lecture' : 'read'}
            </span>
          </div>
        </header>

        {/* ────────────────────────────────────────────
            Body — serif column, red drop-cap lead
           ──────────────────────────────────────────── */}
        <article
          style={{
            fontFamily: 'var(--sa-font-serif)',
            fontSize: 19,
            lineHeight: 1.7,
            color: 'var(--sa-ink)',
          }}
        >
          {/* Lead paragraph with red drop cap */}
          <p style={{ margin: '0 0 24px 0' }}>
            <span
              style={{
                float: 'left',
                fontFamily: 'var(--sa-font-sans)',
                fontWeight: 800,
                fontSize: 88,
                lineHeight: 0.82,
                letterSpacing: '-0.04em',
                marginRight: 14,
                marginTop: 6,
                color: 'var(--sa-red)',
              }}
            >
              {dropCap}
            </span>
            <span
              dangerouslySetInnerHTML={{ __html: leadWithoutFirstChar }}
            />
          </p>

          <BodyBlocks blocks={content} />
        </article>

        {/* ────────────────────────────────────────────
            Related articles
           ──────────────────────────────────────────── */}
        {related.length > 0 && (
          <section
            style={{
              marginTop: 72,
              paddingTop: 32,
              borderTop: '2px solid var(--sa-ink)',
            }}
          >
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
              § {isFr ? 'À lire ensuite' : 'Read next'}
            </div>
            <div style={{ display: 'grid', gap: 0 }}>
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/journal/${r.slug}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <article
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 20,
                      padding: '20px 0',
                      borderBottom: '1px solid var(--sa-rule)',
                      alignItems: 'start',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.14em',
                          textTransform: 'uppercase',
                          color: 'var(--sa-red)',
                          marginBottom: 8,
                        }}
                      >
                        {pickCat(r, isFr)}
                      </div>
                      <div
                        className="display"
                        style={{
                          fontFamily: 'var(--sa-font-sans)',
                          fontSize: 22,
                          fontWeight: 700,
                          letterSpacing: '-0.02em',
                          lineHeight: 1.15,
                          color: 'var(--sa-ink)',
                          textWrap: 'balance',
                        }}
                      >
                        {pickTitle(r, isFr)}
                      </div>
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: 'var(--sa-ink-4)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.readTime} min →
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ────────────────────────────────────────────
            Footer CTA — test my site
           ──────────────────────────────────────────── */}
        <div
          style={{
            marginTop: 64,
            paddingTop: 32,
            borderTop: '2px solid var(--sa-ink)',
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
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                color: 'var(--sa-ink)',
              }}
            >
              {isFr
                ? 'Votre URL, 40 secondes, gratuit.'
                : 'Your URL, 40 seconds, free.'}
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
      </div>
    </Shell>
  );
}
