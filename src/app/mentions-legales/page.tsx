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
              Ce site est hébergé exclusivement en Suisse par <b>Infomaniak Network SA</b>,
              <br />
              Rue Eugène-Marziano 25, 1227 Les Acacias (GE), Suisse.
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
                  Swissalytics <b>ne collecte aucune donnée personnelle</b> de ses utilisateurs.
                </li>
                <li>Aucun compte utilisateur n&apos;est requis.</li>
                <li>Aucun cookie de tracking n&apos;est utilisé.</li>
                <li>
                  Les URL analysées ne sont <b>ni stockées ni enregistrées</b>.
                </li>
                <li>Les résultats sont calculés en temps réel et ne sont pas conservés.</li>
                <li>Aucune donnée n&apos;est transmise à des tiers.</li>
              </ul>
            </>
          ),
        },
        {
          n: '04',
          h: 'Propriété intellectuelle',
          body:
            "Le contenu de ce site (textes, graphiques, code source) est protégé par le droit d'auteur. La marque Swissalytics est une propriété de Pixelab.",
        },
        {
          n: '05',
          h: 'Limitation de responsabilité',
          body:
            "Les résultats d'analyse fournis par Swissalytics sont donnés à titre indicatif. Ils ne constituent pas un conseil professionnel en référencement. Pixelab décline toute responsabilité quant aux décisions prises sur la base de ces résultats.",
        },
        {
          n: '06',
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
              Hosted exclusively in Switzerland by <b>Infomaniak Network SA</b>,
              <br />
              Rue Eugène-Marziano 25, 1227 Les Acacias (GE), Switzerland.
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
                  Swissalytics <b>collects no personal data</b>.
                </li>
                <li>No user account required.</li>
                <li>No tracking cookies.</li>
                <li>
                  Analyzed URLs are <b>neither stored nor logged</b>.
                </li>
                <li>Results are computed in real time and not retained.</li>
                <li>No data is shared with third parties.</li>
              </ul>
            </>
          ),
        },
        {
          n: '04',
          h: 'Intellectual Property',
          body:
            'Site content (text, graphics, source code) is copyright-protected. The Swissalytics brand is property of Pixelab.',
        },
        {
          n: '05',
          h: 'Liability',
          body:
            'Audit results are indicative, not professional SEO advice. Pixelab disclaims liability for decisions based on them.',
        },
        {
          n: '06',
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
            ? "Conformité nLPD, hébergement genevois, zéro tracking. La version courte : on ne stocke rien."
            : 'nFADP-compliant, Geneva-hosted, zero tracking. Short version: we store nothing.'}
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
