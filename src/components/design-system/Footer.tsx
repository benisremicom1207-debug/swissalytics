'use client';

import Link from 'next/link';
import { Logo } from './primitives';
import { useTheme } from './ThemeProvider';
import { COPY } from '@/lib/i18n/copy';

const LINKS: Record<string, { label: string; href?: string; external?: boolean }[]> = {
  produit: [
    { label: 'Méthode', href: '/methode' },
    { label: 'Exemples', href: '/exemples' },
    { label: 'API' },
    { label: 'Changelog' },
  ],
  ressources: [
    { label: 'Journal', href: '/journal' },
    { label: 'Glossaire SEO' },
    { label: 'Guide GEO' },
    { label: 'Mentions légales', href: '/mentions-legales' },
  ],
  agence: [
    { label: 'Pixelab ↗', href: 'https://pixelab.ch', external: true },
    { label: 'Audit sur mesure', href: 'https://pixelab.ch/contact', external: true },
    { label: 'hello@swissalytics.com', href: 'mailto:hello@swissalytics.com' },
  ],
};

export default function Footer() {
  const { lang } = useTheme();
  const copy = COPY[lang];

  return (
    <footer className="ink-t" style={{ marginTop: 96, background: 'var(--sa-bg)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div
          className="rule-b"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 40,
            padding: '48px 0',
          }}
        >
          <div>
            <div style={{ marginBottom: 20 }}>
              <Logo />
            </div>
            <p
              style={{
                fontSize: 14,
                color: 'var(--sa-ink-3)',
                lineHeight: 1.55,
                maxWidth: 320,
                margin: 0,
              }}
            >
              {lang === 'fr'
                ? "L'audit SEO & GEO qui lit votre site comme Google — et comme ChatGPT, Perplexity, Gemini."
                : 'The SEO & GEO audit that reads your site like Google — and like ChatGPT, Perplexity, Gemini.'}
            </p>
          </div>
          <FooterCol
            title={lang === 'fr' ? 'Produit' : 'Product'}
            labels={copy.footerProduit}
            items={LINKS.produit}
          />
          <FooterCol
            title={lang === 'fr' ? 'Ressources' : 'Resources'}
            labels={copy.footerRessources}
            items={LINKS.ressources}
          />
          <FooterCol
            title={lang === 'fr' ? 'Agence' : 'Agency'}
            labels={copy.footerAgence}
            items={LINKS.agence}
          />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: '24px 0',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div
              className="mono"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--sa-ink-3)',
              }}
            >
              <span>{copy.footerMeta[0]}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{copy.footerMeta[1]}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    background: 'var(--sa-red)',
                    borderRadius: '50%',
                  }}
                />
                {copy.footerMeta[2]}
              </span>
            </div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--sa-ink-3)',
              }}
            >
              {copy.poweredBy}{' '}
              <a
                href="https://pixelab.ch"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  borderBottom: '2px solid var(--sa-red)',
                  paddingBottom: 1,
                  color: 'var(--sa-ink)',
                }}
              >
                Pixelab
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  labels,
  items,
}: {
  title: string;
  labels: string[];
  items: { label: string; href?: string; external?: boolean }[];
}) {
  return (
    <div>
      <h4
        className="mono"
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--sa-ink)',
          margin: '0 0 16px 0',
        }}
      >
        {title}
      </h4>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((it, i) => {
          const label = labels[i] ?? it.label;
          const content = (
            <span
              style={{
                fontSize: 14,
                color: 'var(--sa-ink-3)',
                cursor: 'pointer',
              }}
            >
              {label}
            </span>
          );
          return (
            <li key={i} style={{ marginBottom: 10 }}>
              {it.href ? (
                it.external ? (
                  <a href={it.href} target="_blank" rel="noopener noreferrer">
                    {content}
                  </a>
                ) : (
                  <Link href={it.href}>{content}</Link>
                )
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
