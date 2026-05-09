'use client';

import type { AnalysisResult } from '@/lib/types';
import type {
  GeoIndexationEngineResult,
  SchemaSignals,
  EeatSignals,
  LighthouseScores,
} from '@/lib/analyzers/types';

/**
 * GeoTabContent — 4ᵉ onglet "Indexation IA / GEO".
 *
 * Affiche les 4 panneaux empilés : Indexation IA → Schema.org → E-E-A-T → Lighthouse.
 * Si `report.geoAnalysis` est absent (loading async, mode degraded, ancien rapport
 * pré-P2), affiche un état vide.
 *
 * Pour l'instant, seul le panneau Indexation IA est implémenté (P3.1).
 * Les 3 autres viennent dans les sous-phases suivantes.
 */
interface GeoTabContentProps {
  report: AnalysisResult;
  isFr: boolean;
}

export function GeoTabContent({ report, isFr }: GeoTabContentProps) {
  const geo = report.geoAnalysis;

  if (!geo) {
    return <GeoEmptyState isFr={isFr} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <IndexationPanel indexation={geo.geo.indexation} isFr={isFr} />
      <SchemaPanel schema={geo.geo.schema} isFr={isFr} />
      <EeatPanel eeat={geo.geo.eeat} isFr={isFr} />
      <LighthousePanel lighthouse={geo.seo.lighthouse} isFr={isFr} />
    </div>
  );
}

/* ---------------- empty state ---------------- */

function GeoEmptyState({ isFr }: { isFr: boolean }) {
  // Skeleton qui imite la structure des 4 panneaux à venir, avec scanner bars
  // animées. Rassure l'utilisateur que l'analyse tourne (vs juste "indisponible").
  // Réutilise sa-flash + sa-scorecard-scan déjà utilisés par le Scorecard IA-Ready.
  const placeholders = [
    { num: '06', label_fr: 'Indexation IA', label_en: 'AI indexation' },
    { num: '07', label_fr: 'Schema.org', label_en: 'Schema.org' },
    { num: '08', label_fr: 'E-E-A-T', label_en: 'E-E-A-T' },
    { num: '09', label_fr: 'Lighthouse', label_en: 'Lighthouse' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Bandeau d'état clair en tête */}
      <div
        className="ink-b mono"
        style={{
          padding: '14px 24px',
          background: 'var(--sa-ink)',
          color: 'var(--sa-cream)',
          fontSize: 12,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          animation: 'sa-flash 1.4s ease-in-out infinite',
        }}
      >
        <span aria-hidden="true">●</span>
        <span>
          {isFr
            ? 'Analyse IA en cours — interroge ChatGPT, Claude, Gemini, Mistral…'
            : 'AI analysis running — querying ChatGPT, Claude, Gemini, Mistral…'}
        </span>
      </div>

      {placeholders.map((p) => (
        <section key={p.num} className="frame" style={{ background: 'var(--sa-cream)' }}>
          <div
            className="ink-b mono"
            style={{
              padding: '12px 24px',
              background: 'var(--sa-ink)',
              color: 'var(--sa-cream)',
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 700,
              opacity: 0.5,
            }}
          >
            §{p.num} — {isFr ? p.label_fr : p.label_en} ·{' '}
            <span style={{ animation: 'sa-flash 1.4s ease-in-out infinite' }}>···</span>/100
          </div>
          {/* Scanner bar = signal "ça travaille" sans contenu fictif */}
          <div
            style={{
              position: 'relative',
              height: 6,
              background: 'rgba(10, 10, 10, 0.06)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: 6,
                width: '40%',
                background: 'var(--sa-ink-4)',
                animation: 'sa-scorecard-scan 1.6s ease-in-out infinite',
              }}
            />
          </div>
          <div
            style={{
              padding: '40px 24px',
              minHeight: 80,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--sa-ink-4)',
                animation: 'sa-flash 1.4s ease-in-out infinite',
              }}
            >
              {isFr ? 'Chargement…' : 'Loading…'}
            </span>
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------------- Indexation IA panel (P3.1) ---------------- */

function IndexationPanel({
  indexation,
  isFr,
}: {
  indexation: AnalysisResult['geoAnalysis'] extends infer T
    ? T extends { geo: { indexation: infer I } }
      ? I
      : never
    : never;
  isFr: boolean;
}) {
  const engineEntries = Object.entries(indexation.engines);

  return (
    <section className="frame" style={{ background: 'var(--sa-cream)' }}>
      <PanelHeader
        num="06"
        label={isFr ? 'Indexation IA' : 'AI indexation'}
        score={indexation.score}
        right={
          <span>
            {indexation.totalIndexed}/{indexation.totalEnabled}{' '}
            {isFr ? 'moteurs IA vous indexent' : 'AI engines index you'}
            {indexation.region ? ` · ${indexation.region}` : ''}
          </span>
        }
      />

      {engineEntries.length === 0 ? (
        <div
          className="mono"
          style={{
            padding: '32px 24px',
            color: 'var(--sa-ink-3)',
            fontSize: 12,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {isFr
            ? 'Aucun moteur IA configuré. Ajoutez une clé API LLM pour activer ce test.'
            : 'No AI engine configured. Add an LLM API key to enable this test.'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 0,
          }}
        >
          {engineEntries.map(([id, engine], i) => (
            <EngineCard
              key={id}
              id={id}
              engine={engine}
              isFr={isFr}
              isLastRow={i >= engineEntries.length - (engineEntries.length % 4 || 4)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function EngineCard({
  id,
  engine,
  isFr,
}: {
  id: string;
  engine: GeoIndexationEngineResult;
  isFr: boolean;
  isLastRow: boolean;
}) {
  const displayName = engine.name || id.charAt(0).toUpperCase() + id.slice(1);
  const indexedColor = engine.indexed ? 'var(--sa-green, #2d8e4f)' : 'var(--sa-ink-4)';
  const confidenceLabel = formatConfidence(engine.confidence, isFr);

  return (
    <div
      style={{
        padding: '20px 20px 18px',
        borderTop: '2px solid var(--sa-ink)',
        borderRight: '2px solid var(--sa-ink)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 120,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--sa-ink)',
            letterSpacing: '-0.01em',
          }}
        >
          {displayName}
        </div>
        <span
          aria-label={engine.indexed ? (isFr ? 'Indexé' : 'Indexed') : (isFr ? 'Non indexé' : 'Not indexed')}
          title={engine.indexed ? (isFr ? 'Indexé' : 'Indexed') : (isFr ? 'Non indexé' : 'Not indexed')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 22,
            height: 22,
            background: indexedColor,
            color: 'var(--sa-cream)',
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 0,
          }}
        >
          {engine.indexed ? '✓' : '×'}
        </span>
      </div>

      {engine.company && (
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--sa-ink-4)',
          }}
        >
          {engine.company}
        </div>
      )}

      <div
        className="mono"
        style={{
          display: 'flex',
          gap: 8,
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--sa-ink-3)',
          marginTop: 'auto',
        }}
      >
        <span>{confidenceLabel}</span>
        <span>·</span>
        <span>
          {engine.mentions} {isFr ? 'mentions' : 'mentions'}
        </span>
      </div>
    </div>
  );
}

function PanelHeader({
  num,
  label,
  score,
  right,
}: {
  num: string;
  label: string;
  score: number;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="ink-b mono"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        padding: '12px 24px',
        background: 'var(--sa-ink)',
        color: 'var(--sa-cream)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}
    >
      <span>
        §{num} — {label} · <span style={{ color: 'var(--sa-cream)' }}>{score}/100</span>
      </span>
      {right && <span style={{ opacity: 0.85, fontWeight: 700 }}>{right}</span>}
    </div>
  );
}

/* ---------------- Schema.org panel (P3.2) ---------------- */

interface SchemaItemDef {
  key: keyof SchemaSignals;
  fr: string;
  en: string;
  hint_fr: string;
  hint_en: string;
}

const SCHEMA_ITEMS: SchemaItemDef[] = [
  { key: 'organization', fr: 'Organization', en: 'Organization', hint_fr: 'Identifie votre entreprise pour Google et les IA.', hint_en: 'Identifies your company for Google and AI engines.' },
  { key: 'website', fr: 'WebSite', en: 'WebSite', hint_fr: 'Active la SearchBox dans les SERPs Google.', hint_en: 'Enables SearchBox in Google SERPs.' },
  { key: 'breadcrumb', fr: 'BreadcrumbList', en: 'BreadcrumbList', hint_fr: 'Améliore la navigation et le maillage interne perçu.', hint_en: 'Improves navigation and perceived internal linking.' },
  { key: 'article', fr: 'Article', en: 'Article', hint_fr: 'Indispensable pour les contenus éditoriaux.', hint_en: 'Essential for editorial content.' },
  { key: 'author', fr: 'Author / Person', en: 'Author / Person', hint_fr: 'Signal E-E-A-T fort pour Google et IA.', hint_en: 'Strong E-E-A-T signal for Google and AI.' },
  { key: 'faqPage', fr: 'FAQPage', en: 'FAQPage', hint_fr: 'Permet d’apparaître en featured snippets et dans Gemini/ChatGPT.', hint_en: 'Enables featured snippets and surfacing in Gemini/ChatGPT.' },
];

function SchemaPanel({ schema, isFr }: { schema: { score: number; totalFound: number; schemas: SchemaSignals }; isFr: boolean }) {
  return (
    <section className="frame" style={{ background: 'var(--sa-cream)' }}>
      <PanelHeader
        num="07"
        label={isFr ? 'Schema.org' : 'Schema.org'}
        score={schema.score}
        right={
          <span>
            {schema.totalFound}/{SCHEMA_ITEMS.length}{' '}
            {isFr ? 'types détectés' : 'types detected'}
          </span>
        }
      />
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {SCHEMA_ITEMS.map((item, i) => {
          const found = schema.schemas[item.key];
          return (
            <li
              key={item.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr',
                alignItems: 'center',
                gap: 16,
                padding: '14px 24px',
                borderTop: i === 0 ? '2px solid var(--sa-ink)' : '1px solid var(--sa-rule)',
              }}
            >
              <StatusBadge ok={found} isFr={isFr} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--sa-ink)' }}>
                  {isFr ? item.fr : item.en}
                </span>
                <span style={{ fontSize: 13, color: 'var(--sa-ink-3)', lineHeight: 1.4 }}>
                  {isFr ? item.hint_fr : item.hint_en}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------- E-E-A-T panel (P3.3) ---------------- */

function EeatPanel({ eeat, isFr }: { eeat: { score: number; signals: EeatSignals }; isFr: boolean }) {
  const signals = [
    {
      key: 'teamPage',
      label_fr: 'Page équipe',
      label_en: 'Team page',
      hint_fr: 'Présente les humains derrière le site (Expertise + Trust).',
      hint_en: 'Shows the humans behind the site (Expertise + Trust).',
      ok: eeat.signals.teamPage.found,
      detail: null,
    },
    {
      key: 'legalMentions',
      label_fr: 'Mentions légales',
      label_en: 'Legal mentions',
      hint_fr: 'Obligation légale + signal de fiabilité.',
      hint_en: 'Legal requirement + trustworthiness signal.',
      ok: eeat.signals.legalMentions,
      detail: null,
    },
    {
      key: 'contactPage',
      label_fr: 'Page contact',
      label_en: 'Contact page',
      hint_fr: 'Permet aux IA de citer un point de contact vérifiable.',
      hint_en: 'Allows AI to cite a verifiable contact.',
      ok: eeat.signals.contactPage.found,
      detail: null,
    },
    {
      key: 'testimonials',
      label_fr: 'Témoignages',
      label_en: 'Testimonials',
      hint_fr: 'Reviews/avis renforcent l’autorité et la crédibilité.',
      hint_en: 'Reviews/testimonials reinforce authority and credibility.',
      ok: eeat.signals.testimonials.found,
      detail: eeat.signals.testimonials.count > 0
        ? `${eeat.signals.testimonials.count} ${isFr ? 'détecté(s)' : 'detected'}`
        : null,
    },
  ] as const;

  return (
    <section className="frame" style={{ background: 'var(--sa-cream)' }}>
      <PanelHeader
        num="08"
        label="E-E-A-T"
        score={eeat.score}
        right={
          <span>
            {signals.filter((s) => s.ok).length}/{signals.length}{' '}
            {isFr ? 'signaux présents' : 'signals present'}
          </span>
        }
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        }}
      >
        {signals.map((s) => (
          <div
            key={s.key}
            style={{
              padding: '20px',
              borderTop: '2px solid var(--sa-ink)',
              borderRight: '2px solid var(--sa-ink)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              minHeight: 140,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--sa-ink)' }}>
                {isFr ? s.label_fr : s.label_en}
              </span>
              <StatusBadge ok={s.ok} isFr={isFr} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--sa-ink-3)', lineHeight: 1.4 }}>
              {isFr ? s.hint_fr : s.hint_en}
            </span>
            {s.detail && (
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-4)',
                  marginTop: 'auto',
                }}
              >
                {s.detail}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Lighthouse panel (P3.4) ---------------- */

const LIGHTHOUSE_METRICS = [
  { key: 'performance', fr: 'Performance', en: 'Performance' },
  { key: 'accessibility', fr: 'Accessibilité', en: 'Accessibility' },
  { key: 'bestPractices', fr: 'Bonnes pratiques', en: 'Best practices' },
  { key: 'seo', fr: 'SEO', en: 'SEO' },
] as const;

function LighthousePanel({ lighthouse, isFr }: { lighthouse: LighthouseScores; isFr: boolean }) {
  const avg = Math.round(
    (lighthouse.performance + lighthouse.accessibility + lighthouse.bestPractices + lighthouse.seo) / 4,
  );
  return (
    <section className="frame" style={{ background: 'var(--sa-cream)' }}>
      <PanelHeader
        num="09"
        label="Lighthouse"
        score={avg}
        right={
          <span>{isFr ? 'Audit Google · 4 axes' : 'Google audit · 4 axes'}</span>
        }
      />

      {lighthouse.isEstimated && (
        <div
          className="mono"
          style={{
            padding: '12px 24px',
            background: 'var(--sa-amber, #fff7d6)',
            borderTop: '2px solid var(--sa-ink)',
            color: 'var(--sa-ink)',
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          {isFr
            ? '⚠️ Scores estimés — clé Google PageSpeed non configurée pour ce rapport.'
            : '⚠️ Estimated scores — Google PageSpeed key not configured for this report.'}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        }}
      >
        {LIGHTHOUSE_METRICS.map((m) => {
          const value = lighthouse[m.key as 'performance' | 'accessibility' | 'bestPractices' | 'seo'];
          const color = scoreColorLocal(value);
          return (
            <div
              key={m.key}
              style={{
                padding: '24px 20px',
                borderTop: '2px solid var(--sa-ink)',
                borderRight: '2px solid var(--sa-ink)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minHeight: 140,
              }}
            >
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-4)',
                  fontWeight: 700,
                }}
              >
                {isFr ? m.fr : m.en}
              </span>
              <span
                className="display tnum"
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color,
                  lineHeight: 1,
                }}
              >
                {value}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--sa-ink-4)',
                  marginTop: 'auto',
                }}
              >
                / 100
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- shared status badge ---------------- */

function StatusBadge({ ok, isFr }: { ok: boolean; isFr: boolean }) {
  return (
    <span
      aria-label={ok ? (isFr ? 'Présent' : 'Present') : (isFr ? 'Absent' : 'Absent')}
      title={ok ? (isFr ? 'Présent' : 'Present') : (isFr ? 'Absent' : 'Absent')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        background: ok ? 'var(--sa-green, #2d8e4f)' : 'var(--sa-ink-4)',
        color: 'var(--sa-cream)',
        fontSize: 16,
        fontWeight: 700,
        borderRadius: 0,
      }}
    >
      {ok ? '✓' : '×'}
    </span>
  );
}

/* ---------------- helpers ---------------- */

function scoreColorLocal(score: number): string {
  if (score >= 80) return 'var(--sa-green, #2d8e4f)';
  if (score >= 60) return 'var(--sa-amber-ink, #b88600)';
  return 'var(--sa-red, #cc1f1a)';
}

function formatConfidence(confidence: string, isFr: boolean): string {
  const fr: Record<string, string> = {
    high: 'Confiance haute',
    medium: 'Confiance moyenne',
    low: 'Confiance faible',
    none: 'Pas de signal',
  };
  const en: Record<string, string> = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
    none: 'No signal',
  };
  return (isFr ? fr : en)[confidence] || confidence;
}
