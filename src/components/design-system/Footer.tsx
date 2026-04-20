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
                aria-label="Pixelab"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  borderBottom: '2px solid var(--sa-red)',
                  paddingBottom: 1,
                  color: 'var(--sa-ink)',
                  lineHeight: 1,
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1024 768"
                  aria-hidden="true"
                  style={{ height: '1em', width: 'auto', fill: 'currentColor' }}
                >
                  <path d="m711.883 311.572-21.47 7.157v69.566c0 5.44 1 10.877 3.148 15.887 2.003 4.866 5.008 9.16 8.73 12.882 3.722 3.865 8.159 6.729 13.025 8.733 5.01 2.147 10.307 3.29 15.89 3.29 5.438 0 10.735-1.143 15.888-3.29 4.723-2.004 9.161-5.011 12.883-8.733 3.721-3.721 6.726-8.016 8.73-12.882 2.147-5.153 3.293-10.448 3.293-15.887 0-5.582-1.146-10.879-3.293-15.889-2.004-4.866-5.009-9.304-8.73-13.025s-8.017-6.729-12.883-8.733c-5.153-2.147-10.45-3.148-15.889-3.148-5.582 0-10.879 1.001-15.889 3.148-1.288.573-2.431 1.003-3.433 1.72zm-135.807 1.145-21.613 7.156v108.213h21.613zm-205.295 32.78-21.613 7.155v75.434h21.613zm280.114 2.003.142 4.58c-5.725-2.863-12.024-4.437-18.465-4.437-5.439 0-10.877 1-15.886 3.148-4.867 2.147-9.163 5.01-13.028 8.732-3.721 3.722-6.583 8.16-8.73 13.026-2.004 5.01-3.149 10.45-3.149 15.889s1.145 10.878 3.149 15.888c2.147 4.867 5.009 9.16 8.73 13.026 3.865 3.721 8.16 6.583 13.028 8.73 5.01 2.004 10.447 3.15 15.886 3.15 6.441 0 12.74-1.574 18.465-4.437l-.142 3.29h21.47V347.5zm-358.1.143c-5.44 0-10.879 1-15.889 3.148a44.3 44.3 0 0 0-13.025 8.732c-3.722 3.722-6.585 8.16-8.733 13.026-2.004 5.01-3.148 10.306-3.148 15.889v60.833l21.47 7.157v-32.063c1.146.573 2.291 1.145 3.436 1.574 5.01 2.148 10.45 3.293 15.889 3.293 5.44 0 10.879-1.145 15.889-3.293 4.866-2.003 9.16-4.865 13.025-8.73 3.722-3.722 6.583-8.016 8.73-12.883 2.148-5.01 3.149-10.45 3.149-15.889 0-5.582-1.001-10.878-3.149-15.888-2.147-4.867-5.008-9.16-8.73-13.026a44.3 44.3 0 0 0-13.025-8.732c-5.01-2.147-10.307-3.148-15.89-3.148m207.664.287c-10.879 0-20.9 4.294-28.629 11.88-7.586 7.587-11.736 17.75-11.736 28.485s4.15 20.898 11.736 28.484c7.73 7.587 17.75 11.88 28.629 11.88 5.582 0 11.02-1.144 16.174-3.434 5.01-2.147 9.446-5.298 13.168-9.163l-15.172-14.312c-3.722 4.008-8.73 6.154-14.17 6.154-7.014 0-13.17-3.72-16.605-9.16h56.826v-10.45c0-10.734-4.15-20.897-11.737-28.483s-17.749-11.881-28.484-11.881m-120.99.43 29.058 39.505-28.914 40.22h25.334l16.606-22.042 16.46 22.043h25.48l-29.06-40.078 28.772-39.649h-25.908l-15.889 22.186-15.601-22.186zm120.99 20.324c6.87 0 13.025 3.722 16.603 9.304h-33.208c3.435-5.582 9.591-9.304 16.605-9.304m230.746.287c10.592 0 19.324 8.589 19.324 19.324 0 10.592-8.732 19.322-19.324 19.322-10.735 0-19.322-8.73-19.322-19.322a19.243 19.243 0 0 1 19.322-19.324m-438.41.142c10.592 0 19.322 8.732 19.322 19.324s-8.73 19.325-19.322 19.325-19.324-8.732-19.324-19.324 8.732-19.325 19.324-19.325m339.777 0c3.722 0 7.444 1.002 10.45 3.149 3.149 1.86 5.582 4.725 7.013 8.017 1.288 2.577 1.861 5.296 1.861 8.158 0 3.436-.858 6.727-2.576 9.733-1.717 2.863-4.007 5.296-7.013 6.871-2.863 1.718-6.3 2.72-9.735 2.72-10.592 0-19.322-8.731-19.322-19.323s8.73-19.325 19.322-19.325" />
                </svg>
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
