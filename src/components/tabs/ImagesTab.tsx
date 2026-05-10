'use client';

import { useState } from 'react';
import type { ImagesAnalysis } from '@/lib/types';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';
import { SectionHeader, TabFrame } from './_v2';

function statColor(v: number, good: number, mid: number): string {
  if (v >= good) return 'var(--sa-ok)';
  if (v >= mid) return 'var(--sa-warn)';
  return 'var(--sa-red)';
}

function StatCell({ value, label, color = 'var(--sa-ink)' }: { value: number | string; label: string; color?: string }) {
  return (
    <div
      style={{
        border: '1px solid var(--sa-rule)',
        background: 'var(--sa-cream-2)',
        padding: '14px 12px',
        textAlign: 'center',
      }}
    >
      <div className="display tnum" style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>
        {value}
      </div>
      <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)' }}>
        {label}
      </div>
    </div>
  );
}

export default function ImagesTab({ data }: { data: ImagesAnalysis }) {
  const [showAllImages, setShowAllImages] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const altPercent = data.total > 0 ? Math.round((data.withAlt / data.total) * 100) : 100;

  const formatCounts: Record<string, number> = {};
  data.images.forEach((img) => {
    const f = img.format.toUpperCase();
    formatCounts[f] = (formatCounts[f] || 0) + 1;
  });

  const displayedImages = showAllImages ? data.images : data.images.slice(0, 15);

  return (
    <TabFrame>
      {/* §01 — Stats */}
      <section>
        <SectionHeader
          num="01"
          title="Statistiques des images"
          info={
            <InfoBox
              items={[
                { term: 'Attribut Alt (texte alternatif)', definition: "Un texte descriptif associé à chaque image. Lu par les moteurs et lecteurs d'écran. Décrivez en quelques mots." },
                { term: 'Lazy Loading', definition: "Retarde le chargement des images hors écran. Les images se chargent quand l'utilisateur scrolle." },
                { term: 'Format WebP / AVIF', definition: 'Formats modernes (compression -25 à -50% vs JPEG/PNG sans perte visible). Recommandés par Google.' },
                { term: 'Dimensions explicites', definition: 'width + height évitent les sauts de mise en page (CLS).' },
                { term: 'Srcset (responsive)', definition: 'Permet au navigateur de choisir la meilleure taille selon l\'écran. Réduit le temps mobile.' },
              ]}
            />
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatCell value={data.total} label="Total" />
          <StatCell value={data.withAlt} label="Avec alt" color={data.withAlt > 0 ? 'var(--sa-ok)' : 'var(--sa-ink)'} />
          <StatCell
            value={data.withoutAlt}
            label="Alt manquant"
            color={data.withoutAlt > 0 ? 'var(--sa-red)' : 'var(--sa-ink)'}
          />
          <StatCell value={`${altPercent}%`} label="Couverture" color={statColor(altPercent, 80, 50)} />
          <StatCell
            value={data.total - data.withoutResponsive}
            label="Responsive (srcset)"
            color={data.total > 0 && data.withoutResponsive === 0 ? 'var(--sa-ok)' : data.total > 3 ? 'var(--sa-warn)' : 'var(--sa-ink)'}
          />
        </div>
      </section>

      {/* §02 — Issues */}
      <IssuesList issues={data.issues} />

      {/* §03 — Format distribution */}
      {Object.keys(formatCounts).length > 0 && (
        <section>
          <SectionHeader num="03" title="Formats d'image" />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(formatCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([format, count]) => (
                <div
                  key={format}
                  className="mono"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    border: '1px solid var(--sa-rule)',
                    background: 'var(--sa-cream-2)',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--sa-ink)',
                  }}
                >
                  <span>{format}</span>
                  <span className="tnum" style={{ color: 'var(--sa-ink-4)', fontWeight: 600 }}>×{count}</span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* §04 — Image list */}
      {data.images.length > 0 && (
        <section>
          <SectionHeader
            num="04"
            title={`Détail des images (${data.images.length})`}
            rightSlot={
              data.images.length > 15 ? (
                <button
                  onClick={() => setShowAllImages(!showAllImages)}
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
                  {showAllImages ? 'Réduire' : `Tout afficher (${data.images.length})`}
                </button>
              ) : null
            }
          />
          <div style={{ border: '1px solid var(--sa-rule)', background: 'var(--sa-cream-2)' }}>
            {displayedImages.map((img, i) => (
              <div
                key={i}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '64px 1fr auto',
                  gap: 14,
                  padding: '12px 16px',
                  borderBottom: i < displayedImages.length - 1 ? '1px solid var(--sa-rule)' : 'none',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    background: 'var(--sa-cream-3)',
                    border: '1px solid var(--sa-rule)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {img.src && !failedImages.has(i) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={img.src}
                      alt={img.alt || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={() => setFailedImages((prev) => new Set(prev).add(i))}
                    />
                  ) : (
                    <span className="mono" style={{ fontSize: 9, color: 'var(--sa-ink-4)', fontWeight: 700 }}>
                      {img.src ? img.format.toUpperCase() : 'N/A'}
                    </span>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        padding: '2px 6px',
                        border: '1px solid var(--sa-rule)',
                        background: 'var(--sa-cream)',
                        color: 'var(--sa-ink-3)',
                      }}
                    >
                      {img.format.toUpperCase()}
                    </span>
                    {img.hasAlt && img.alt ? (
                      <span
                        className="mono"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          padding: '2px 6px',
                          border: '1px solid var(--sa-ok)',
                          color: 'var(--sa-ok)',
                          background: 'rgba(47, 107, 63, 0.06)',
                        }}
                      >
                        ALT
                      </span>
                    ) : (
                      <span
                        className="mono"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          padding: '2px 6px',
                          border: '1px solid var(--sa-red)',
                          color: 'var(--sa-red)',
                          background: 'rgba(229, 36, 26, 0.05)',
                        }}
                      >
                        ALT MANQUANT
                      </span>
                    )}
                    {img.isLazy && (
                      <span
                        className="mono"
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          padding: '2px 6px',
                          border: '1px solid var(--sa-rule)',
                          color: 'var(--sa-ink-4)',
                          background: 'var(--sa-cream)',
                        }}
                      >
                        LAZY
                      </span>
                    )}
                  </div>
                  {img.alt && (
                    <p style={{ fontSize: 13, color: 'var(--sa-ink-2)', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {img.alt}
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: 'var(--sa-ink-4)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--sa-font-mono)' }}>
                    {img.src}
                  </p>
                </div>

                <div className="mono tnum" style={{ fontSize: 11, color: 'var(--sa-ink-4)', textAlign: 'right', flexShrink: 0 }}>
                  {img.width && img.height ? `${img.width}×${img.height}` : '—'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <CTABanner variant="inline" />
    </TabFrame>
  );
}
