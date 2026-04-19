'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import Shell from '@/components/design-system/Shell';
import { DisplayTitle } from '@/components/design-system/primitives';
import { useTheme } from '@/components/design-system/ThemeProvider';

type Section = {
  n: string;
  h: string;
  body: ReactNode;
};

type SummaryTile = {
  k: string;
  v: string;
};

export default function ConfidentialitePage() {
  const { lang } = useTheme();
  const isFr = lang === 'fr';
  const last = isFr
    ? 'Dernière mise à jour : novembre 2025'
    : 'Last updated: November 2025';

  const summary: SummaryTile[] = isFr
    ? [
        { k: 'Compte', v: 'Aucun' },
        { k: 'Cookies', v: 'Aucun' },
        { k: 'Partage', v: '30 jours' },
        { k: 'Hébergement', v: 'Infomaniak · Suisse' },
        { k: 'Logs', v: '24h en mémoire' },
        { k: 'Rapports', v: '180 jours max' },
      ]
    : [
        { k: 'Account', v: 'None' },
        { k: 'Cookies', v: 'None' },
        { k: 'Sharing', v: '30 days' },
        { k: 'Hosting', v: 'Infomaniak · Switzerland' },
        { k: 'Logs', v: '24h in memory' },
        { k: 'Reports', v: '180 days max' },
      ];

  const sections: Section[] = isFr
    ? [
        {
          n: '01',
          h: "Ce qu'on ne fait pas",
          body: (
            <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
              <li>Aucun compte utilisateur, aucune inscription.</li>
              <li>Aucun cookie de tracking, aucun pixel publicitaire.</li>
              <li>Aucune vente, aucun partage, aucune revente de données.</li>
              <li>Aucun profilage, aucune publicité ciblée.</li>
              <li>Aucune donnée transférée hors de Suisse.</li>
            </ul>
          ),
        },
        {
          n: '02',
          h: "Ce qu'on traite (strict minimum)",
          body: (
            <>
              <p style={{ margin: '0 0 14px 0' }}>
                Pour faire tourner l&apos;audit, on traite <b>uniquement</b> :
              </p>
              <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
                <li>
                  <b>L&apos;URL que vous saisissez</b> — utilisée le temps de l&apos;analyse, puis
                  stockée dans le rapport généré.
                </li>
                <li>
                  <b>Le rapport d&apos;analyse</b> — conservé <b>180 jours maximum</b>, puis purgé
                  automatiquement.
                </li>
                <li>
                  <b>Un lien de partage</b> (si vous cliquez sur « Partager ») — expire au bout de{' '}
                  <b>30 jours</b>, révocable manuellement à tout moment.
                </li>
                <li>
                  <b>Votre IP, pour le rate-limit</b> — conservée <b>24 h en mémoire vive</b>{' '}
                  uniquement, jamais écrite sur disque, fenêtre glissante.
                </li>
              </ul>
            </>
          ),
        },
        {
          n: '03',
          h: 'Hébergement',
          body: (
            <>
              Hébergement exclusif en Suisse chez <b>Infomaniak Network SA</b>, Genève.
              <br />
              Aucune donnée ne transite via des serveurs hors du territoire suisse.
            </>
          ),
        },
        {
          n: '04',
          h: 'Rétention des données',
          body: (
            <>
              <p style={{ margin: '0 0 14px 0' }}>
                Trois durées de vie, appliquées automatiquement par le code&nbsp;:
              </p>
              <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
                <li>
                  <b>Rapports d&apos;analyse</b> — conservés <b>180 jours maximum</b>, puis purgés
                  automatiquement. Pas de rétention prolongée, pas d&apos;archivage « au cas où ».
                </li>
                <li>
                  <b>Liens de partage (share tokens)</b> — identifiant aléatoire (ex.{' '}
                  <span
                    className="mono"
                    style={{ background: 'var(--sa-cream-2)', padding: '1px 6px' }}
                  >
                    r_a3f9k2
                  </span>
                  ) qui <b>expire après 30 jours</b>. Révocable manuellement à tout moment sur
                  simple demande.
                </li>
                <li>
                  <b>Rate-limit IP</b> — stockage <b>en mémoire vive uniquement</b>, aucune
                  persistance disque, fenêtre glissante de <b>24 h</b>. Purgé à chaque redémarrage
                  du serveur.
                </li>
              </ul>
              <p style={{ margin: '14px 0 0 0' }}>
                Suppression immédiate d&apos;un rapport ou d&apos;un lien&nbsp;: écrivez à
                l&apos;adresse ci-dessous.
              </p>
            </>
          ),
        },
        {
          n: '05',
          h: 'Vos droits (nLPD)',
          body: (
            <>
              Au titre de la loi suisse sur la protection des données (nLPD), vous pouvez à tout
              moment :
              <ul style={{ paddingLeft: 20, margin: '10px 0 0 0', lineHeight: 1.8 }}>
                <li>Demander l&apos;accès à vos données (s&apos;il y en a).</li>
                <li>Demander la suppression d&apos;un rapport partagé.</li>
                <li>Demander la rectification de toute information incorrecte.</li>
              </ul>
              <p style={{ margin: '14px 0 0 0' }}>
                Écrivez à{' '}
                <a
                  href="mailto:privacy@swissalytics.ch"
                  style={{ color: 'var(--sa-ink)', textDecoration: 'underline' }}
                >
                  privacy@swissalytics.ch
                </a>
                . Réponse sous 7 jours.
              </p>
            </>
          ),
        },
        {
          n: '06',
          h: 'Modifications',
          body: "Cette politique peut être mise à jour. Toute modification substantielle sera indiquée en tête de page avec la nouvelle date.",
        },
      ]
    : [
        {
          n: '01',
          h: "What we don't do",
          body: (
            <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
              <li>No user accounts, no sign-up.</li>
              <li>No tracking cookies, no advertising pixels.</li>
              <li>No data selling, sharing, or resale.</li>
              <li>No profiling, no targeted advertising.</li>
              <li>No data leaves Switzerland.</li>
            </ul>
          ),
        },
        {
          n: '02',
          h: 'What we process (strict minimum)',
          body: (
            <>
              <p style={{ margin: '0 0 14px 0' }}>
                To run the audit, we process <b>only</b>:
              </p>
              <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
                <li>
                  <b>The URL you enter</b> — used during the analysis, then stored inside the
                  generated report.
                </li>
                <li>
                  <b>The analysis report</b> — kept <b>180 days maximum</b>, then
                  auto-purged.
                </li>
                <li>
                  <b>A share link</b> (if you click &quot;Share&quot;) — expires after{' '}
                  <b>30 days</b>, revocable manually at any time.
                </li>
                <li>
                  <b>Your IP, for rate-limiting</b> — held <b>in-memory for 24h</b> only, never
                  written to disk, on a rolling window.
                </li>
              </ul>
            </>
          ),
        },
        {
          n: '03',
          h: 'Hosting',
          body: (
            <>
              Hosted exclusively in Switzerland by <b>Infomaniak Network SA</b>, Geneva.
              <br />
              No data transits through servers outside Swiss territory.
            </>
          ),
        },
        {
          n: '04',
          h: 'Data retention',
          body: (
            <>
              <p style={{ margin: '0 0 14px 0' }}>
                Three lifetimes, enforced automatically by the code:
              </p>
              <ul style={{ paddingLeft: 20, margin: 0, lineHeight: 1.8 }}>
                <li>
                  <b>Analysis reports</b> — kept <b>180 days maximum</b>, then auto-purged. No
                  extended retention, no &quot;just in case&quot; archiving.
                </li>
                <li>
                  <b>Share tokens</b> — random ID (e.g.{' '}
                  <span
                    className="mono"
                    style={{ background: 'var(--sa-cream-2)', padding: '1px 6px' }}
                  >
                    r_a3f9k2
                  </span>
                  ) that <b>expires after 30 days</b>. Revocable manually at any time on request.
                </li>
                <li>
                  <b>Rate-limit IP tracking</b> — stored <b>in-memory only</b>, no disk
                  persistence, <b>24h</b> rolling window. Flushed on every server restart.
                </li>
              </ul>
              <p style={{ margin: '14px 0 0 0' }}>
                To delete a report or revoke a link immediately, email the address below.
              </p>
            </>
          ),
        },
        {
          n: '05',
          h: 'Your rights (nFADP)',
          body: (
            <>
              Under the Swiss Federal Act on Data Protection (nFADP), at any time you may:
              <ul style={{ paddingLeft: 20, margin: '10px 0 0 0', lineHeight: 1.8 }}>
                <li>Request access to your data (if any).</li>
                <li>Request deletion of a shared report.</li>
                <li>Request rectification of any incorrect information.</li>
              </ul>
              <p style={{ margin: '14px 0 0 0' }}>
                Email{' '}
                <a
                  href="mailto:privacy@swissalytics.ch"
                  style={{ color: 'var(--sa-ink)', textDecoration: 'underline' }}
                >
                  privacy@swissalytics.ch
                </a>
                . Response within 7 days.
              </p>
            </>
          ),
        },
        {
          n: '06',
          h: 'Changes',
          body: 'This policy may be updated. Any substantial change will be noted at the top of the page with the new date.',
        },
      ];

  return (
    <Shell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px' }}>
        <Link
          href="/"
          className="mono"
          style={{
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
          § {isFr ? 'Politique de confidentialité' : 'Privacy policy'}
        </div>

        <DisplayTitle
          parts={
            isFr
              ? ['On ne stocke', ['rien', { red: '.' }]]
              : ['We store', ['nothing', { red: '.' }]]
          }
          size="page"
        />

        <p
          style={{
            fontSize: 18,
            color: 'var(--sa-ink-3)',
            marginTop: 24,
            maxWidth: 680,
            lineHeight: 1.5,
          }}
        >
          {isFr
            ? "La version courte : aucun compte, aucun tracker, aucun cookie, aucun partage. L'URL que vous entrez est analysée en direct et oubliée."
            : 'Short version: no account, no trackers, no cookies, no sharing. The URL you enter is analysed live and forgotten.'}
        </p>

        <div
          className="mono"
          style={{
            fontSize: 11,
            color: 'var(--sa-ink-4)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: 18,
          }}
        >
          {last}
        </div>

        {/* Summary · six-tile ink frame */}
        <div
          className="frame"
          style={{ marginTop: 48, background: 'var(--sa-cream-2)' }}
        >
          <div
            className="ink-b mono"
            style={{
              padding: '10px 16px',
              background: 'var(--sa-ink)',
              color: 'var(--sa-cream)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>{isFr ? 'Résumé · en une minute' : 'Summary · one minute'}</span>
            <span style={{ color: 'var(--sa-red)' }}>TL;DR</span>
          </div>
          <div
            style={{
              padding: '32px 28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0,
            }}
          >
            {summary.map((r, i) => (
              <div
                key={r.k}
                style={{
                  padding: '14px 16px',
                  borderLeft: i % 3 === 0 ? 0 : '1px solid var(--sa-rule)',
                  borderTop: i >= 3 ? '1px solid var(--sa-rule)' : 0,
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
                    marginBottom: 6,
                  }}
                >
                  {r.k}
                </div>
                <div
                  className="display"
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: '-0.01em',
                    color: 'var(--sa-ink)',
                    lineHeight: 1.2,
                  }}
                >
                  {r.v}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed sections — legal style */}
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
                <h2
                  className="h2"
                  style={{ fontSize: 30, margin: '0 0 16px 0', letterSpacing: '-0.02em' }}
                >
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
