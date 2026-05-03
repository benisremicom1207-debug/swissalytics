'use client';

import React from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import { DisplayTitle } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';

type Section = {
  n: string;
  h: string;
  body: React.ReactNode;
};

export default function MentionsLegalesPage() {
  const { lang } = useTheme();
  const isFr = lang === 'fr';

  const sections: Section[] = isFr
    ? [
        {
          n: '01',
          h: 'Éditeur',
          body: (
            <>
              Swissalytics est un service gratuit propulsé par <b>Pixelab</b>.
              <br />
              Siège : Genève, Suisse
              <br />
              Contact :{' '}
              <a
                href="https://pixelab.ch/contact"
                style={{ color: 'var(--sa-ink)', textDecoration: 'underline' }}
              >
                pixelab.ch/contact
              </a>
            </>
          ),
        },
        {
          n: '02',
          h: 'Hébergement',
          body: (
            <>
              Application hébergée à Genève par <b>Infomaniak Network SA</b>,
              <br />
              Rue Eugène-Marziano 25, 1227 Les Acacias (GE), Suisse.
              <br />
              Base de données hébergée à Zurich par <b>Supabase</b> (région eu-central-2).
              <br />
              Aucune donnée ne transite en dehors de la Suisse.
            </>
          ),
        },
        {
          n: '03',
          h: 'Protection des données (nLPD)',
          body: (
            <>
              <p style={{ margin: '0 0 12px 0' }}>
                Conformément à la nouvelle Loi fédérale sur la protection des données (nLPD, en
                vigueur depuis le 1er septembre 2023) :
              </p>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>
                  Aucun <b>compte utilisateur</b> n&apos;est requis. Aucun <b>cookie de tracking</b> n&apos;est utilisé.
                </li>
                <li>
                  Aucune donnée nominative (email, nom, téléphone) n&apos;est collectée.
                </li>
                <li>
                  Lors d&apos;une analyse, nous enregistrons l&apos;URL et son rapport technique, ainsi que
                  des métadonnées techniques (pays, navigateur, IP <b>pseudonymisée par HMAC-SHA-256</b>{' '}
                  non réversible). Détail complet en §04 ci-dessous.
                </li>
                <li>
                  Les données sont conservées <b>180 jours</b> puis supprimées automatiquement.
                </li>
                <li>
                  Base légale : <b>intérêt légitime</b> (analytics produit et sécurité anti-abus).
                </li>
                <li>
                  Aucune donnée n&apos;est transmise à des tiers en dehors de Pixelab.
                </li>
              </ul>
            </>
          ),
        },
        {
          n: '04',
          h: 'Données collectées',
          body: (
            <>
              <p style={{ margin: '0 0 12px 0' }}>
                Détail des champs enregistrés à chaque analyse :
              </p>
              <ul style={{ paddingLeft: 20, margin: '0 0 16px 0' }}>
                <li><b>URL analysée</b> et langue d&apos;interface (fr/en)</li>
                <li>Score d&apos;analyse et rapport technique complet de la page</li>
                <li>
                  <b>Empreinte HMAC-SHA-256</b> de votre adresse IP, avec sel serveur secret —
                  non réversible, utilisée pour la sécurité et la mesure d&apos;usage agrégée
                </li>
                <li>
                  Pays (code ISO déduit de l&apos;IP), <i>user-agent</i> du navigateur, et page
                  d&apos;origine (<i>referrer</i>) si fournie
                </li>
              </ul>
              <p style={{ margin: 0 }}>
                Ces données peuvent être utilisées pour proposer les services SEO de Pixelab aux
                propriétaires de sites analysés. Hébergement : <b>Supabase</b> (Zurich, Suisse).
              </p>
            </>
          ),
        },
        {
          n: '05',
          h: 'Propriété intellectuelle',
          body:
            "Le contenu de ce site (textes, graphiques, code source) est protégé par le droit d'auteur. La marque Swissalytics est une propriété de Pixelab.",
        },
        {
          n: '06',
          h: 'Limitation de responsabilité',
          body:
            "Les résultats d'analyse fournis par Swissalytics sont donnés à titre indicatif. Ils ne constituent pas un conseil professionnel en référencement. Pixelab décline toute responsabilité quant aux décisions prises sur la base de ces résultats.",
        },
        {
          n: '07',
          h: 'Droit applicable',
          body: 'Le droit suisse est applicable. Le for juridique est à Genève, Suisse.',
        },
      ]
    : [
        {
          n: '01',
          h: 'Publisher',
          body: (
            <>
              Swissalytics is a free service by <b>Pixelab</b>.
              <br />
              HQ: Geneva, Switzerland
              <br />
              Contact:{' '}
              <a
                href="https://pixelab.ch/contact"
                style={{ color: 'var(--sa-ink)', textDecoration: 'underline' }}
              >
                pixelab.ch/contact
              </a>
            </>
          ),
        },
        {
          n: '02',
          h: 'Hosting',
          body: (
            <>
              Application hosted in Geneva by <b>Infomaniak Network SA</b>,
              <br />
              Rue Eugène-Marziano 25, 1227 Les Acacias (GE), Switzerland.
              <br />
              Database hosted in Zurich by <b>Supabase</b> (eu-central-2 region).
              <br />
              No data transits outside Switzerland.
            </>
          ),
        },
        {
          n: '03',
          h: 'Data Protection (nFADP)',
          body: (
            <>
              <p style={{ margin: '0 0 12px 0' }}>
                In line with the revised Swiss Federal Act on Data Protection (nFADP, in force since
                1 September 2023):
              </p>
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                <li>
                  No <b>user account</b> required. No <b>tracking cookies</b>.
                </li>
                <li>
                  No personally identifying data (email, name, phone) is collected.
                </li>
                <li>
                  When you run an analysis, we store the URL and its technical report, plus
                  technical metadata (country, browser, IP <b>pseudonymized via HMAC-SHA-256</b>{' '}
                  non-reversible). Full details in §04 below.
                </li>
                <li>
                  Data is retained <b>180 days</b> then automatically deleted.
                </li>
                <li>
                  Legal basis: <b>legitimate interest</b> (product analytics and abuse prevention).
                </li>
                <li>
                  No data is shared with third parties outside Pixelab.
                </li>
              </ul>
            </>
          ),
        },
        {
          n: '04',
          h: 'Data collected',
          body: (
            <>
              <p style={{ margin: '0 0 12px 0' }}>
                Fields stored on each analysis:
              </p>
              <ul style={{ paddingLeft: 20, margin: '0 0 16px 0' }}>
                <li><b>Analyzed URL</b> and interface language (fr/en)</li>
                <li>Score and full technical report of the page</li>
                <li>
                  <b>HMAC-SHA-256 fingerprint</b> of your IP address, with server-side secret salt —
                  non-reversible, used for security and aggregate usage measurement
                </li>
                <li>
                  Country (ISO code from IP), browser <i>user-agent</i>, and origin page
                  (<i>referrer</i>) if provided
                </li>
              </ul>
              <p style={{ margin: 0 }}>
                These data may be used to offer Pixelab&apos;s SEO services to owners of analyzed sites.
                Hosted on <b>Supabase</b> (Zurich, Switzerland).
              </p>
            </>
          ),
        },
        {
          n: '05',
          h: 'Intellectual Property',
          body:
            'Site content (text, graphics, source code) is copyright-protected. The Swissalytics brand is property of Pixelab.',
        },
        {
          n: '06',
          h: 'Liability',
          body:
            'Audit results are indicative, not professional SEO advice. Pixelab disclaims liability for decisions based on them.',
        },
        {
          n: '07',
          h: 'Governing Law',
          body: 'Swiss law applies. Jurisdiction: Geneva, Switzerland.',
        },
      ];

  return (
    <Shell>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 24px' }}>
        <Link
          href="/"
          className="mono"
          style={{
            fontFamily: 'var(--sa-font-mono)',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--sa-ink-4)',
            marginBottom: 24,
            display: 'inline-block',
            textDecoration: 'none',
          }}
        >
          ← {isFr ? 'Retour' : 'Back'}
        </Link>

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
          § {isFr ? 'Mentions légales' : 'Legal notice'}
        </div>

        <DisplayTitle
          parts={
            isFr
              ? ['Mentions', ['légales', { red: '.' }]]
              : ['Legal', ['notice', { red: '.' }]]
          }
          size="page"
        />

        <p
          style={{
            fontSize: 18,
            color: 'var(--sa-ink-3)',
            marginTop: 24,
            maxWidth: 640,
            lineHeight: 1.5,
          }}
        >
          {isFr
            ? "Conformité nLPD, hébergement 100 % suisse, zéro tracking. La version courte : pas de cookie, pas de compte, IP pseudonymisée, 180 jours de rétention."
            : 'nFADP-compliant, 100% Swiss-hosted, zero tracking. Short version: no cookies, no account, pseudonymized IP, 180-day retention.'}
        </p>

        <div
          style={{
            marginTop: 64,
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            gap: 0,
          }}
        >
          {sections.map((s) => (
            <React.Fragment key={s.n}>
              <div
                style={{
                  padding: '32px 0',
                  borderTop: '1px solid var(--sa-rule)',
                  borderRight: '1px solid var(--sa-rule)',
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--sa-red)',
                  }}
                >
                  §{s.n}
                </span>
              </div>
              <div
                style={{
                  padding: '32px 0 32px 32px',
                  borderTop: '1px solid var(--sa-rule)',
                }}
              >
                <h2 className="h2" style={{ fontSize: 32, margin: '0 0 16px 0' }}>
                  {s.h}
                </h2>
                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.65,
                    color: 'var(--sa-ink-2)',
                    maxWidth: 680,
                  }}
                >
                  {s.body}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </Shell>
  );
}
