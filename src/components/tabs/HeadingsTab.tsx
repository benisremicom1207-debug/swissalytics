'use client';

import { useState } from 'react';
import type { HeadingsAnalysis, KeywordsAnalysis } from '@/lib/types';
import type { SpaDetection } from '@/lib/analyzer/spa-detection';
import type { KeywordSuggestionsResult } from '@/lib/analyzers/keyword-suggestions';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';
import SpaWarning from '../report/SpaWarning';

/**
 * Brutalist v2 length gauge — replaces the rounded Tailwind original.
 * Square ends, hairline border, mono caption, status colors driven by
 * tokens (sa-ok / sa-warn / sa-red).
 */
function LengthGauge({ value, min, max, label }: { value: number; min: number; max: number; label: string }) {
  const total = max + 40;
  const percent = Math.min(100, (value / total) * 100);
  const optimalStart = (min / total) * 100;
  const optimalEnd = (max / total) * 100;
  const isOptimal = value >= min && value <= max;
  const isTooShort = value > 0 && value < min;
  const isTooLong = value > max;

  const fillColor = isOptimal
    ? 'var(--sa-ok)'
    : value === 0
      ? 'var(--sa-red)'
      : isTooShort
        ? 'var(--sa-warn)'
        : 'var(--sa-red)';

  const valueColor = isOptimal
    ? 'var(--sa-ok)'
    : value === 0
      ? 'var(--sa-red)'
      : 'var(--sa-warn)';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700 }}>
          {label}
        </span>
        <span className="mono tnum" style={{ fontSize: 12, fontWeight: 700, color: valueColor }}>
          {value} car. {isOptimal ? '✓' : isTooShort ? '(trop court)' : isTooLong ? '(trop long)' : value === 0 ? '(manquant)' : ''}
        </span>
      </div>
      <div style={{ position: 'relative', height: 10, background: 'var(--sa-cream-3)', border: '1px solid var(--sa-rule)' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            background: 'rgba(47, 107, 63, 0.15)',
            borderLeft: '1px dashed var(--sa-ok)',
            borderRight: '1px dashed var(--sa-ok)',
            left: `${optimalStart}%`,
            width: `${optimalEnd - optimalStart}%`,
          }}
        />
        {value > 0 && (
          <div style={{ height: '100%', background: fillColor, width: `${percent}%`, transition: 'width 200ms linear' }} />
        )}
      </div>
      <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--sa-ink-4)', marginTop: 4, letterSpacing: '0.08em' }}>
        <span>0</span>
        <span style={{ color: 'var(--sa-ok)' }}>{min}–{max} optimal</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

/* ---------------- section header ---------------- */

function SectionHeader({ num, title, info }: { num: string; title: string; info?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, borderBottom: '1px solid var(--sa-rule)', paddingBottom: 12 }}>
      <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--sa-ink-4)', fontWeight: 700 }}>
        §{num}
      </span>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--sa-ink)', margin: 0, letterSpacing: '-0.01em', flex: 1 }}>
        {title}
      </h3>
      {info && <span style={{ flexShrink: 0 }}>{info}</span>}
    </div>
  );
}

/* ---------------- check pill (placement, target badges) ---------------- */

function CheckPill({ label, ok, abbreviated }: { label: string; ok: boolean; abbreviated?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        border: `1px solid ${ok ? 'var(--sa-ok)' : 'var(--sa-red)'}`,
        background: ok ? 'rgba(47, 107, 63, 0.06)' : 'rgba(229, 36, 26, 0.05)',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--sa-ink-2)', fontWeight: 500 }}>{label}</span>
      <span
        className="mono"
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: ok ? 'var(--sa-ok)' : 'var(--sa-red)',
        }}
      >
        {abbreviated ?? (ok ? '✓ OK' : 'ABSENT')}
      </span>
    </div>
  );
}

/* ---------------- main tab ---------------- */

export default function HeadingsTab({ data, keywords, url, spa, keywordSuggestions, keywordSuggestionsLoading }: { data: HeadingsAnalysis; keywords?: KeywordsAnalysis; url?: string; spa?: SpaDetection; keywordSuggestions?: KeywordSuggestionsResult; keywordSuggestionsLoading?: boolean }) {
  const [showAllHeadings, setShowAllHeadings] = useState(false);

  const headingGroups = [
    { tag: 'H1', items: data.h1 },
    { tag: 'H2', items: data.h2 },
    { tag: 'H3', items: data.h3 },
    { tag: 'H4', items: data.h4 },
    { tag: 'H5', items: data.h5 },
    { tag: 'H6', items: data.h6 },
  ];

  const totalHeadings = data.h1.length + data.h2.length + data.h3.length + data.h4.length + data.h5.length + data.h6.length;

  const allHeadingItems = headingGroups.flatMap(({ tag, items }) =>
    items.map((text, i) => ({ tag, text, i, level: parseInt(tag[1]) }))
  );
  const displayedHeadings = showAllHeadings ? allHeadingItems : allHeadingItems.slice(0, 20);

  return (
    <div className="frame" style={{ background: 'var(--sa-cream)', padding: '32px 36px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

        {spa && <SpaWarning spa={spa} />}

        {/* §01 — Title & Meta Description */}
        <section>
          <SectionHeader
            num="01"
            title="Title & Meta Description"
            info={
              <InfoBox
                items={[
                  { term: 'Balise Title', definition: "Le titre de votre page qui apparaît dans les résultats Google et dans l'onglet du navigateur. C'est l'un des facteurs SEO les plus importants. Idéalement entre 50 et 60 caractères." },
                  { term: 'Meta Description', definition: "Le texte descriptif affiché sous le titre dans les résultats de recherche. Elle n'impacte pas directement le classement, mais un bon texte augmente le taux de clics. Visez 150 à 160 caractères." },
                  { term: 'H1 (Titre principal)', definition: 'Le titre principal de votre page, visible par les visiteurs. Chaque page doit avoir exactement un H1 unique qui décrit clairement le sujet.' },
                  { term: 'H2, H3, H4...', definition: 'Les sous-titres qui structurent votre contenu. Ils créent une hiérarchie logique (comme un sommaire) et aident Google à comprendre l\'organisation de votre page. Ne sautez pas de niveau (ex : pas de H4 directement après un H2).' },
                  { term: 'Aperçu SERP', definition: 'Simulation de l\'apparence de votre page dans les résultats Google. C\'est ce que les internautes voient avant de cliquer — un bon titre et une bonne description augmentent votre taux de clics.' },
                ]}
              />
            }
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', padding: 20 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700, marginBottom: 10 }}>
                Balise Title
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--sa-ink-2)', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {data.title.content || <span style={{ color: 'var(--sa-red)', fontStyle: 'italic' }}>Manquant</span>}
              </p>
              <LengthGauge value={data.title.length} min={50} max={60} label="Longueur" />
            </div>
            <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', padding: 20 }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700, marginBottom: 10 }}>
                Meta Description
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--sa-ink-2)', margin: '0 0 16px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {data.metaDescription.content || <span style={{ color: 'var(--sa-red)', fontStyle: 'italic' }}>Manquante</span>}
              </p>
              <LengthGauge value={data.metaDescription.length} min={150} max={160} label="Longueur" />
            </div>
          </div>
        </section>

        {/* §02 — SERP Preview */}
        <section>
          <SectionHeader num="02" title="Aperçu SERP Google" />
          <div style={{ border: '1px solid var(--sa-rule)', background: '#FFFFFF', padding: 24, maxWidth: 720 }}>
            <div style={{ fontSize: 13, color: '#1a7d1a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif' }}>
              {data.title.content ? (url || 'https://example.com') : '—'}
            </div>
            <h3 style={{ fontSize: 20, color: '#1a0dab', cursor: 'pointer', marginBottom: 4, fontFamily: 'Arial, sans-serif', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textDecoration: 'underline', textDecorationColor: 'transparent' }}>
              {data.title.content || 'Titre manquant — Ajoutez une balise <title>'}
            </h3>
            <p style={{ fontSize: 13, color: '#4d5156', fontFamily: 'Arial, sans-serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
              {data.metaDescription.content || 'Aucune meta description disponible. Google affichera un extrait automatique de votre contenu.'}
            </p>
          </div>
        </section>

        {/* §03 — Keyword Placement */}
        {keywords?.placement && (
          <section>
            <SectionHeader
              num="03"
              title="Placement du mot-clé principal"
              info={
                <InfoBox
                  items={[
                    { term: 'Mot-clé principal', definition: "Le mot le plus pertinent et fréquent identifié automatiquement sur votre page. Il doit apparaître dans les zones clés (titre, H1, méta description, introduction) pour optimiser le référencement." },
                    { term: 'Densité du mot-clé', definition: "Le pourcentage d'apparitions du mot-clé par rapport au nombre total de mots. Une densité entre 1% et 3% est optimale. En dessous, le mot-clé est sous-utilisé. Au-dessus, risque de suroptimisation (keyword stuffing)." },
                  ]}
                />
              }
            />

            {/* P14.A — Schema.org canonical signals (annoncés par le site) */}
            {keywords.schemaKeywords?.found && (
              <div style={{ marginBottom: 20, border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', padding: 16 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700, marginBottom: 10 }}>
                  § Annoncés via Schema.org · {keywords.schemaKeywords.sourceTypes.join(', ')}
                </div>
                {keywords.schemaKeywords.canonicalName && (
                  <div style={{ fontSize: 14, color: 'var(--sa-ink)', fontWeight: 600, marginBottom: 6 }}>
                    « {keywords.schemaKeywords.canonicalName} »
                  </div>
                )}
                {keywords.schemaKeywords.category && (
                  <div style={{ fontSize: 12, color: 'var(--sa-ink-3)', marginBottom: 8 }}>
                    Catégorie : <strong>{keywords.schemaKeywords.category}</strong>
                  </div>
                )}
                {keywords.schemaKeywords.keywords.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {keywords.schemaKeywords.keywords.slice(0, 12).map((kw) => (
                      <span key={kw} className="mono" style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', border: '1px solid var(--sa-rule)', background: 'var(--sa-cream)', color: 'var(--sa-ink)' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Top 3 distinct targets (P13) */}
            {keywords.targets && keywords.targets.length > 1 && (
              <div style={{ marginBottom: 20 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700, marginBottom: 12 }}>
                  Top {keywords.targets.length} mots-clés distincts détectés
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  {keywords.targets.map((t, i) => (
                    <div
                      key={t.word}
                      style={{
                        padding: 14,
                        border: i === 0 ? '2px solid var(--sa-ink)' : '1px solid var(--sa-rule)',
                        background: i === 0 ? 'var(--sa-cream-2)' : 'var(--sa-cream)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700 }}>
                          {i === 0 ? 'Principal' : `Secondaire ${i}`}
                        </span>
                        <span className="mono tnum" style={{ fontSize: 11, color: 'var(--sa-ink-4)' }}>
                          score {t.score}
                        </span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sa-ink)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.word}>
                        « {t.word} »
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { label: 'T', long: 'Title', ok: t.inTitle },
                          { label: 'H1', long: 'H1', ok: t.inH1 },
                          { label: 'M', long: 'Meta description', ok: t.inMetaDescription },
                          { label: '100', long: '100 premiers mots', ok: t.inFirst100Words },
                        ].map((b) => (
                          <span
                            key={b.label}
                            title={`${b.long} : ${b.ok ? 'présent' : 'absent'}`}
                            className="mono"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: 28,
                              height: 22,
                              padding: '0 6px',
                              fontSize: 10,
                              fontWeight: 700,
                              border: `1px solid ${b.ok ? 'var(--sa-ok)' : 'var(--sa-red)'}`,
                              color: b.ok ? 'var(--sa-ok)' : 'var(--sa-red)',
                              background: b.ok ? 'rgba(47, 107, 63, 0.08)' : 'rgba(229, 36, 26, 0.06)',
                            }}
                          >
                            {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, color: 'var(--sa-ink-3)', marginBottom: 6 }}>
                Mot-clé détecté : <span style={{ fontWeight: 700, color: 'var(--sa-ink)' }}>« {keywords.placement.primary} »</span>
              </div>
              {keywords.placement.brand && (
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--sa-ink-4)', marginBottom: 16, fontWeight: 600 }}>
                  § Marque détectée : <span style={{ fontWeight: 700, color: 'var(--sa-ink-3)' }}>{keywords.placement.brand}</span>
                  {typeof keywords.placement.brandMentions === 'number' && keywords.placement.brandMentions > 0 && (
                    <> ({keywords.placement.brandMentions}×)</>
                  )}
                  {' — exclue du calcul SEO'}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                <CheckPill label="Title" ok={keywords.placement.inTitle} />
                <CheckPill label="H1" ok={keywords.placement.inH1} />
                <CheckPill label="Meta desc." ok={keywords.placement.inMetaDescription} />
                <CheckPill label="100 premiers mots" ok={keywords.placement.inFirst100Words} />
              </div>
            </div>

            {(() => {
              const status = keywords.placement.densityStatus;
              const densityColor = status === 'optimal' ? 'var(--sa-ok)' : status === 'low' ? 'var(--sa-warn)' : 'var(--sa-red)';
              return (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 16px',
                    border: `1px solid ${densityColor}`,
                    background: 'var(--sa-cream)',
                  }}
                >
                  <span className="tnum" style={{ fontSize: 13, color: 'var(--sa-ink-2)', fontWeight: 500 }}>
                    Densité : <strong>{keywords.placement.density}%</strong> ({keywords.placement.keywordCount} occ. / {keywords.placement.totalWords} mots)
                  </span>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, color: densityColor }}>
                    {status === 'optimal' ? 'Optimal' : status === 'low' ? 'Faible' : 'Trop élevée'}
                  </span>
                </div>
              );
            })()}
          </section>
        )}

        {/* P14.D / P18.B — LLM suggestions, with inline loader skeleton.
            Placed here, just above the Issues block, so the user reads
            them after seeing the actual current state — and treats them
            as actionable next steps rather than a prediction. */}
        {keywordSuggestions && keywordSuggestions.suggestions.length > 0 ? (
          <section style={{ marginBottom: 20 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-red)', fontWeight: 700, marginBottom: 12 }}>
              ★ Suggestions SEO actionables · IA
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {keywordSuggestions.suggestions.map((s, i) => (
                <div key={i} style={{ padding: 14, border: '2px solid var(--sa-red)', background: 'rgba(229, 36, 26, 0.04)' }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sa-red)', fontWeight: 700, marginBottom: 6 }}>
                    Suggestion {i + 1}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sa-ink)', marginBottom: 8 }}>
                    « {s.keyword} »
                  </div>
                  {s.rationale && (
                    <div style={{ fontSize: 12, color: 'var(--sa-ink-3)', lineHeight: 1.45 }}>
                      {s.rationale}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 9, letterSpacing: '0.06em', color: 'var(--sa-ink-4)', marginTop: 6 }}>
              Généré par {keywordSuggestions.model}.
            </div>
          </section>
        ) : keywordSuggestionsLoading ? (
          <section style={{ marginBottom: 20 }} aria-busy="true" aria-live="polite">
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-red)', fontWeight: 700, marginBottom: 12 }}>
              ★ Suggestions SEO actionables · IA
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ padding: 14, border: '2px dashed var(--sa-red)', background: 'rgba(229, 36, 26, 0.02)', minHeight: 110 }}>
                  <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sa-red)', fontWeight: 700, marginBottom: 6 }}>
                    Suggestion {i}
                  </div>
                  <div style={{ height: 18, background: 'rgba(229, 36, 26, 0.08)', marginBottom: 10, animation: 'sa-pulse 1.4s ease-in-out infinite' }} />
                  <div style={{ height: 8, width: '85%', background: 'rgba(229, 36, 26, 0.06)', marginBottom: 6, animation: 'sa-pulse 1.4s ease-in-out infinite 0.2s' }} />
                  <div style={{ height: 8, width: '60%', background: 'rgba(229, 36, 26, 0.06)', animation: 'sa-pulse 1.4s ease-in-out infinite 0.4s' }} />
                </div>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sa-ink-3)', marginTop: 8, fontStyle: 'italic' }}>
              ⏳ L&apos;IA analyse votre page pour vous formuler des mots-clés à cibler…
            </div>
            <style>{`
              @keyframes sa-pulse {
                0%, 100% { opacity: 0.4; }
                50%      { opacity: 0.9; }
              }
            `}</style>
          </section>
        ) : null}

        {/* §04 — Issues */}
        <IssuesList issues={data.issues} />

        {/* §05 — Heading Count Summary */}
        <section>
          <SectionHeader num="04" title={`Résumé des Headings (${totalHeadings} total)`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {headingGroups.map(({ tag, items }) => (
              <div
                key={tag}
                style={{
                  border: '1px solid var(--sa-rule)',
                  background: 'var(--sa-cream-2)',
                  padding: '14px 12px',
                  textAlign: 'center',
                }}
              >
                <div className="mono" style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', padding: '2px 8px', color: 'var(--sa-ink-3)', marginBottom: 8, border: '1px solid var(--sa-rule)', background: 'var(--sa-cream)' }}>
                  {tag}
                </div>
                <div className="display tnum" style={{ fontSize: 26, fontWeight: 800, color: items.length > 0 ? 'var(--sa-ink)' : 'var(--sa-ink-4)' }}>
                  {items.length}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* §06 — Heading Hierarchy */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid var(--sa-rule)', paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--sa-ink-4)', fontWeight: 700 }}>
                §05
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--sa-ink)', margin: 0, letterSpacing: '-0.01em' }}>
                Structure hiérarchique
              </h3>
            </div>
            {allHeadingItems.length > 20 && (
              <button
                onClick={() => setShowAllHeadings(!showAllHeadings)}
                className="mono"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '6px 12px',
                  border: '1px solid var(--sa-ink)',
                  background: 'var(--sa-cream)',
                  color: 'var(--sa-ink)',
                  cursor: 'pointer',
                }}
              >
                {showAllHeadings ? 'Réduire' : `Tout afficher (${allHeadingItems.length})`}
              </button>
            )}
          </div>

          <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)' }}>
            {totalHeadings === 0 ? (
              <p className="mono" style={{ padding: '20px 16px', fontSize: 12, color: 'var(--sa-ink-4)', fontStyle: 'italic', margin: 0, textAlign: 'center' }}>
                Aucun heading trouvé sur la page
              </p>
            ) : (
              displayedHeadings.map(({ tag, text, i, level }, idx) => (
                <div
                  key={`${tag}-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    paddingLeft: `${(level - 1) * 20 + 14}px`,
                    borderBottom: idx < displayedHeadings.length - 1 ? '1px solid var(--sa-rule)' : 'none',
                  }}
                >
                  <span
                    className="mono"
                    style={{
                      flexShrink: 0,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      padding: '2px 6px',
                      border: '1px solid var(--sa-rule)',
                      color: 'var(--sa-ink-3)',
                      background: 'var(--sa-cream)',
                    }}
                  >
                    {tag}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--sa-ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {text || <em style={{ color: 'var(--sa-red)' }}>Vide</em>}
                  </span>
                  {tag === 'H1' && i === 0 && (
                    <span style={{ flexShrink: 0, color: 'var(--sa-ok)', fontSize: 14, fontWeight: 700 }}>✓</span>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <CTABanner variant="inline" />
      </div>
    </div>
  );
}
