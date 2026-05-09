'use client';

import type { SpaDetection } from '@/lib/analyzer/spa-detection';
import { useTheme } from '@/components/design-system/ThemeProvider';

interface SpaWarningProps {
  spa: SpaDetection;
}

/**
 * Pedagogical banner shown at the top of HeadingsTab + GeoTabContent
 * when the page is a JS-rendered shell. Explains *why* the analyzer
 * reports "no headings / no content" and reframes the recommendation
 * around AI-crawler reality (GPTBot/ClaudeBot/Perplexity don't run JS,
 * Googlebot does but only in a delayed second pass).
 *
 * Renders nothing when `spa.isSpaShell` is false — the banner is only
 * shown when it's load-bearing.
 */
export default function SpaWarning({ spa }: SpaWarningProps) {
  const { lang } = useTheme();
  const isFr = lang === 'fr';
  if (spa.verdict === 'normal') return null;

  const isStyledDivs = spa.verdict === 'styled-divs';

  return (
    <div
      role="status"
      style={{
        border: '2px solid var(--sa-warn)',
        background: 'var(--sa-cream)',
        padding: '20px 24px',
        margin: '0 0 24px 0',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          className="mono"
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-warn)',
            marginBottom: 8,
          }}
        >
          {isStyledDivs
            ? isFr
              ? 'Pas de titres sémantiques (H1, H2…)'
              : 'No semantic headings (H1, H2…)'
            : isFr
              ? 'Site SPA détecté'
              : 'SPA site detected'}
        </div>

        <p
          style={{
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--sa-ink)',
            margin: '0 0 12px 0',
          }}
        >
          {isStyledDivs ? (
            isFr ? (
              <>
                La page contient <strong>{spa.bodyWordCount} mots de contenu</strong> mais{' '}
                <strong>aucune balise H1/H2/H3</strong> dans le HTML. Les titres visibles à l&apos;écran utilisent vraisemblablement des{' '}
                <code style={{ background: 'var(--sa-rule)', padding: '1px 4px' }}>&lt;div&gt;</code> stylisés au lieu de balises sémantiques.
              </>
            ) : (
              <>
                The page contains <strong>{spa.bodyWordCount} words of content</strong> but{' '}
                <strong>no H1/H2/H3 tags</strong> in the HTML. Visible titles likely use styled{' '}
                <code style={{ background: 'var(--sa-rule)', padding: '1px 4px' }}>&lt;div&gt;</code> elements instead of semantic tags.
              </>
            )
          ) : isFr ? (
            <>
              Le HTML statique de cette page contient{' '}
              <strong>{spa.headingCount === 0 ? 'aucun titre' : `${spa.headingCount} titre${spa.headingCount > 1 ? 's' : ''}`}</strong>{' '}
              et seulement <strong>{spa.bodyWordCount} mots</strong>. Les titres et le contenu sont injectés par JavaScript après chargement.
            </>
          ) : (
            <>
              This page&apos;s static HTML contains{' '}
              <strong>{spa.headingCount === 0 ? 'no headings' : `${spa.headingCount} heading${spa.headingCount > 1 ? 's' : ''}`}</strong>{' '}
              and only <strong>{spa.bodyWordCount} words</strong>. Headings and content are injected by JavaScript after load.
            </>
          )}
        </p>

        {!isStyledDivs && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                border: '1px solid var(--sa-rule)',
                padding: '10px 12px',
                background: 'var(--sa-paper)',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-3)',
                  marginBottom: 4,
                }}
              >
                Google ✓
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--sa-ink)' }}>
                {isFr
                  ? 'Rendu JS au second crawl (queue séparée, parfois plusieurs jours).'
                  : 'Renders JS in a second crawl (queued, sometimes days later).'}
              </div>
            </div>
            <div
              style={{
                border: '1px solid var(--sa-warn)',
                padding: '10px 12px',
                background: 'var(--sa-paper)',
              }}
            >
              <div
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-warn)',
                  marginBottom: 4,
                }}
              >
                {isFr ? 'Moteurs IA ✗' : 'AI engines ✗'}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.45, color: 'var(--sa-ink)' }}>
                {isFr
                  ? 'GPTBot, ClaudeBot, PerplexityBot lisent uniquement le HTML statique : ils ne voient rien.'
                  : 'GPTBot, ClaudeBot, PerplexityBot read only static HTML: they see nothing.'}
              </div>
            </div>
          </div>
        )}

        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.08em',
            color: 'var(--sa-ink-3)',
            fontWeight: 600,
          }}
        >
          {isStyledDivs
            ? isFr
              ? '→ Recommandation : remplacer les <div> de titre par des balises <h1>, <h2>, <h3> sémantiques. Aide Google et les moteurs IA à comprendre la hiérarchie de la page.'
              : '→ Recommendation: replace the styled <div> titles with semantic <h1>, <h2>, <h3> tags. Helps Google and AI engines understand page hierarchy.'
            : isFr
              ? '→ Recommandation : SSR ou pré-rendu (Next.js, Astro, Nuxt) pour exposer le contenu aux moteurs IA.'
              : '→ Recommendation: SSR or pre-rendering (Next.js, Astro, Nuxt) to expose content to AI engines.'}
        </div>

        {spa.indicators.length > 0 && (
          <details style={{ marginTop: 12 }}>
            <summary
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--sa-ink-4)',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              {isFr ? 'Détails techniques' : 'Technical details'}
            </summary>
            <ul
              style={{
                margin: '8px 0 0 0',
                padding: '0 0 0 18px',
                fontSize: 12,
                lineHeight: 1.55,
                color: 'var(--sa-ink-3)',
              }}
            >
              {spa.indicators.map((ind) => (
                <li key={ind}>{ind}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
