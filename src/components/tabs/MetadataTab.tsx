'use client';

import type { MetadataAnalysis } from '@/lib/types';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';
import { SectionHeader, TabFrame } from './_v2';

function StatusBadge({ exists }: { exists: boolean }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: exists ? 'var(--sa-ok)' : 'var(--sa-red)',
        flexShrink: 0,
      }}
    >
      {exists ? '✓ DÉFINI' : 'MANQUANT'}
    </span>
  );
}

export default function MetadataTab({ data }: { data: MetadataAnalysis }) {
  const metaChecks = [
    { label: 'og:title',          value: data.ogTitle,         exists: !!data.ogTitle },
    { label: 'og:description',    value: data.ogDescription,   exists: !!data.ogDescription },
    { label: 'og:image',          value: data.ogImage ? 'Défini' : null, exists: !!data.ogImage },
    { label: 'og:url',            value: data.ogUrl,           exists: !!data.ogUrl },
    { label: 'og:type',           value: data.ogType,          exists: !!data.ogType },
    { label: 'twitter:card',      value: data.twitterCard,     exists: !!data.twitterCard },
    { label: 'twitter:title',     value: data.twitterTitle,    exists: !!data.twitterTitle },
    { label: 'twitter:image',     value: data.twitterImage ? 'Défini' : null, exists: !!data.twitterImage },
    { label: 'favicon',           value: data.favicon ? 'Détecté' : null, exists: !!data.favicon },
  ];

  const totalDefined = metaChecks.filter((m) => m.exists).length;
  const completeness = Math.round((totalDefined / metaChecks.length) * 100);
  const completenessColor =
    completeness >= 80 ? 'var(--sa-ok)' : completeness >= 50 ? 'var(--sa-warn)' : 'var(--sa-red)';

  return (
    <TabFrame>
      {/* §01 — Complétude des métadonnées */}
      <section>
        <SectionHeader
          num="01"
          title="Métadonnées sociales"
          info={
            <InfoBox
              items={[
                { term: 'Open Graph (og:)', definition: "Balises qui contrôlent l'apparence quand votre page est partagée sur Facebook, LinkedIn ou WhatsApp." },
                { term: 'Twitter Cards', definition: "Équivalent Open Graph pour Twitter/X — affichent un aperçu riche." },
                { term: 'Favicon', definition: "Petite icône dans l'onglet du navigateur. Renforce l'identité." },
                { term: 'Données structurées (JSON-LD)', definition: "Code invisible qui aide Google à comprendre le contenu (article, produit, FAQ…). Peut déclencher des rich snippets." },
                { term: 'Directive Robots', definition: 'meta robots indique à Google si la page doit être indexée et si les liens doivent être suivis.' },
                { term: 'Hreflang', definition: 'Versions linguistiques de la page. Essentiel pour les sites multilingues.' },
              ]}
            />
          }
        />
        <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700 }}>
              Complétude
            </span>
            <span className="display tnum" style={{ fontSize: 22, fontWeight: 800, color: completenessColor }}>
              {totalDefined}/{metaChecks.length}{' '}
              <span style={{ fontSize: 14, color: 'var(--sa-ink-4)' }}>({completeness}%)</span>
            </span>
          </div>
          <div style={{ position: 'relative', height: 10, background: 'var(--sa-cream-3)', border: '1px solid var(--sa-rule)' }}>
            <div style={{ height: '100%', background: completenessColor, width: `${completeness}%`, transition: 'width 200ms linear' }} />
          </div>
        </div>
      </section>

      {/* §02 — Social Previews */}
      <section>
        <SectionHeader num="02" title="Aperçus réseaux sociaux" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {/* Facebook / LinkedIn */}
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700, marginBottom: 8 }}>
              Facebook / LinkedIn
            </div>
            <div style={{ border: '1px solid var(--sa-rule)', background: '#f0f2f5' }}>
              {data.ogImage ? (
                <div style={{ height: 180, overflow: 'hidden', background: '#e0e0e0' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.ogImage}
                    alt="OG Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div style={{ height: 180, background: '#d0d0d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#666', fontSize: 13 }}>Aucune image OG</span>
                </div>
              )}
              <div style={{ padding: 12, background: '#e4e6eb' }}>
                <p style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.04em' }}>
                  {data.ogUrl ? (() => { try { return new URL(data.ogUrl!).hostname; } catch { return data.ogUrl; } })() : '—'}
                </p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data.ogTitle || 'Pas de titre OG'}
                </p>
                <p style={{ fontSize: 12, color: '#444', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {data.ogDescription || 'Pas de description OG'}
                </p>
              </div>
            </div>
          </div>

          {/* Twitter / X */}
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700, marginBottom: 8 }}>
              Twitter / X
            </div>
            <div style={{ border: '1px solid var(--sa-rule)', background: '#000' }}>
              {data.twitterImage || data.ogImage ? (
                <div style={{ height: 180, overflow: 'hidden', background: '#222' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.twitterImage || data.ogImage || ''}
                    alt="Twitter Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div style={{ height: 180, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#777', fontSize: 13 }}>Aucune image Twitter</span>
                </div>
              )}
              <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {data.twitterTitle || data.ogTitle || 'Pas de titre'}
                </p>
                <p style={{ fontSize: 12, color: '#aaa', margin: '0 0 4px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {data.twitterDescription || data.ogDescription || 'Pas de description'}
                </p>
                <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
                  Card: <span style={{ color: '#bbb' }}>{data.twitterCard || 'Non défini'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* §03 — Issues */}
      <IssuesList issues={data.issues} />

      {/* §04 — Meta Tags Checklist */}
      <section>
        <SectionHeader num="04" title="Vérification des balises" />
        <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)' }}>
          {metaChecks.map((meta, i) => (
            <div
              key={meta.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '10px 16px',
                borderBottom: i < metaChecks.length - 1 ? '1px solid var(--sa-rule)' : 'none',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--sa-ink-2)', fontWeight: 600 }}>
                  {meta.label}
                </span>
                {meta.value && meta.exists && meta.label !== 'og:image' && meta.label !== 'twitter:image' && meta.label !== 'favicon' && (
                  <p style={{ fontSize: 11, color: 'var(--sa-ink-4)', margin: '2px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {meta.value}
                  </p>
                )}
              </div>
              <StatusBadge exists={meta.exists} />
            </div>
          ))}
        </div>
      </section>

      {/* §05 — Duplicate metadata (only when issues) */}
      {data.duplicates && (data.duplicates.titleCount > 1 || data.duplicates.descriptionCount > 1 || !data.duplicates.titleMatchesOg) && (
        <section>
          <SectionHeader num="05" title="Métadonnées dupliquées" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {data.duplicates.titleCount > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--sa-warn)', background: 'rgba(184, 123, 0, 0.06)' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--sa-ink)', fontWeight: 600 }}>Balises &lt;title&gt;</div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sa-ink-4)', marginTop: 2 }}>
                    Une seule recommandée
                  </div>
                </div>
                <div className="display tnum" style={{ fontSize: 26, fontWeight: 800, color: 'var(--sa-warn)' }}>{data.duplicates.titleCount}×</div>
              </div>
            )}
            {data.duplicates.descriptionCount > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--sa-warn)', background: 'rgba(184, 123, 0, 0.06)' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--sa-ink)', fontWeight: 600 }}>Meta description</div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sa-ink-4)', marginTop: 2 }}>
                    Une seule recommandée
                  </div>
                </div>
                <div className="display tnum" style={{ fontSize: 26, fontWeight: 800, color: 'var(--sa-warn)' }}>{data.duplicates.descriptionCount}×</div>
              </div>
            )}
            {!data.duplicates.titleMatchesOg && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--sa-ink)', fontWeight: 600 }}>Title ≠ og:title</div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--sa-ink-4)', marginTop: 2 }}>
                    Vérifiez la cohérence
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 8px', border: '1px solid var(--sa-warn)', color: 'var(--sa-warn)' }}>
                  DIFFÉRENT
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* §06 — Robots + Structured data */}
      <section>
        <SectionHeader num="06" title="Directives & données structurées" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', padding: 18 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700, marginBottom: 12 }}>
              Directive Robots
            </div>
            {data.robots ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.robots.split(',').map((directive, i) => {
                  const d = directive.trim().toLowerCase();
                  const isNegative = d.includes('noindex') || d.includes('nofollow') || d.includes('none');
                  const tone = isNegative ? 'var(--sa-red)' : 'var(--sa-ok)';
                  return (
                    <span
                      key={i}
                      className="mono"
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        padding: '4px 10px',
                        border: `1px solid ${tone}`,
                        color: tone,
                        background: 'var(--sa-cream)',
                      }}
                    >
                      {directive.trim()}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="mono" style={{ fontSize: 12, color: 'var(--sa-ink-4)', margin: 0 }}>
                Aucune directive — par défaut : index, follow
              </p>
            )}
          </div>

          <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)', padding: 18 }}>
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700, marginBottom: 12 }}>
              Données structurées (JSON-LD)
            </div>
            {data.structuredData.exists ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {data.structuredData.types.map((type) => (
                  <span
                    key={type}
                    className="mono"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      padding: '4px 10px',
                      border: '1px solid var(--sa-rule)',
                      color: 'var(--sa-ink)',
                      background: 'var(--sa-cream)',
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mono" style={{ fontSize: 12, color: 'var(--sa-ink-4)', margin: 0 }}>
                Aucune donnée structurée détectée
              </p>
            )}
          </div>
        </div>
      </section>

      {/* §07 — Hreflang */}
      {data.hreflang.length > 0 && (
        <section>
          <SectionHeader num="07" title={`Balises Hreflang (${data.hreflang.length})`} />
          <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)' }}>
            {data.hreflang.map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: i < data.hreflang.length - 1 ? '1px solid var(--sa-rule)' : 'none',
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '3px 8px',
                    border: '1px solid var(--sa-rule)',
                    color: 'var(--sa-ink)',
                    background: 'var(--sa-cream)',
                    flexShrink: 0,
                  }}
                >
                  {h.lang}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--sa-ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 16 }}>
                  {h.href}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <CTABanner variant="inline" />
    </TabFrame>
  );
}
