'use client';

import { useState } from 'react';
import type { ImagesAnalysis } from '@/lib/types';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';

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
    <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6 md:p-8">
      <div className="space-y-8">

        {/* 1. Stats grid */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            Statistiques des Images
            <InfoBox
              items={[
                { term: 'Attribut Alt (texte alternatif)', definition: 'Un texte descriptif associé à chaque image. Il est lu par les moteurs de recherche et les lecteurs d\'écran pour les personnes malvoyantes. Décrivez le contenu de l\'image en quelques mots (ex : « Logo Swissalytics bleu sur fond blanc »).' },
                { term: 'Lazy Loading', definition: 'Technique qui retarde le chargement des images hors de l\'écran. Les images ne se chargent que lorsque l\'utilisateur fait défiler la page, ce qui accélère l\'affichage initial.' },
                { term: 'Format WebP / AVIF', definition: 'Formats d\'image modernes qui offrent une meilleure compression que JPEG et PNG, réduisant le poids de 25 à 50 % sans perte de qualité visible. Google recommande leur utilisation.' },
                { term: 'Dimensions explicites', definition: 'Spécifier la largeur et la hauteur dans le HTML évite les « sauts » de mise en page pendant le chargement (appelé CLS — Cumulative Layout Shift).' },
                { term: 'Srcset (images responsives)', definition: 'L\'attribut srcset permet au navigateur de choisir la meilleure taille d\'image selon l\'écran de l\'utilisateur. Il réduit le temps de chargement sur mobile en servant des images plus petites.' },
              ]}
            />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className="text-2xl font-bold text-text-primary mb-1">{data.total}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Total</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className="text-2xl font-bold text-status-success mb-1">{data.withAlt}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Avec alt</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className={`text-2xl font-bold mb-1 ${data.withoutAlt > 0 ? 'text-status-error' : 'text-text-primary'}`}>{data.withoutAlt}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Alt manquant</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className={`text-2xl font-bold mb-1 ${altPercent >= 80 ? 'text-status-success' : altPercent >= 50 ? 'text-status-warning' : 'text-status-error'}`}>{altPercent}%</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Couverture</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className={`text-2xl font-bold mb-1 ${data.withoutResponsive === 0 ? 'text-status-success' : data.total > 3 ? 'text-status-warning' : 'text-text-primary'}`}>
                {data.total - data.withoutResponsive}
              </div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Responsive (srcset)</div>
            </div>
          </div>
        </div>

        {/* 2. Issues (moved up) */}
        <IssuesList issues={data.issues} />

        {/* 3. Format distribution */}
        {Object.keys(formatCounts).length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary mb-4">Formats d&apos;image</h4>
            <div className="flex gap-3 flex-wrap">
              {Object.entries(formatCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([format, count]) => (
                  <div key={format} className="px-4 py-2 bg-surface-tertiary border border-border-secondary rounded-lg flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">{format}</span>
                    <span className="text-sm text-text-quaternary">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 4. Image list (limit 15, collapsible) */}
        {data.images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-text-primary">Détail des images ({data.images.length})</h4>
              {data.images.length > 15 && (
                <button
                  onClick={() => setShowAllImages(!showAllImages)}
                  className="text-xs px-3 py-1 rounded-lg bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-colors border border-border-secondary"
                >
                  {showAllImages ? 'Réduire' : `Tout afficher (${data.images.length})`}
                </button>
              )}
            </div>
            <div className="space-y-3">
              {displayedImages.map((img, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-surface-tertiary border border-border-secondary rounded-xl">
                  <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-surface-secondary border border-border-secondary flex items-center justify-center">
                    {img.src && !failedImages.has(i) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/api/image-proxy?url=${encodeURIComponent(img.src)}`}
                        alt={img.alt || ''}
                        className="w-full h-full object-cover"
                        onError={() => setFailedImages(prev => new Set(prev).add(i))}
                      />
                    ) : (
                      <span className="text-xs text-text-quaternary">{img.src ? img.format.toUpperCase() : 'N/A'}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-secondary text-text-tertiary">{img.format.toUpperCase()}</span>
                      {img.hasAlt && img.alt ? (
                        <span className="text-xs text-status-success font-medium">ALT</span>
                      ) : (
                        <span className="text-xs text-status-error font-medium">ALT MANQUANT</span>
                      )}
                      {img.isLazy && (
                        <span className="text-xs text-text-tertiary font-medium">LAZY</span>
                      )}
                    </div>
                    {img.alt && (
                      <p className="text-sm text-text-secondary truncate">{img.alt}</p>
                    )}
                    <p className="text-xs text-text-quaternary truncate">{img.src}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {img.width && img.height ? (
                      <span className="text-xs text-text-quaternary">{img.width} x {img.height}</span>
                    ) : (
                      <span className="text-xs text-text-quaternary">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <CTABanner variant="inline" />
      </div>
    </div>
  );
}
