'use client';

import { useState } from 'react';
import type { HeadingsAnalysis, KeywordsAnalysis } from '@/lib/types';
import { CheckCircle2, Globe, Type, Target } from 'lucide-react';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';

function LengthGauge({ value, min, max, label }: { value: number; min: number; max: number; label: string }) {
  const total = max + 40;
  const percent = Math.min(100, (value / total) * 100);
  const optimalStart = (min / total) * 100;
  const optimalEnd = (max / total) * 100;
  const isOptimal = value >= min && value <= max;
  const isTooShort = value > 0 && value < min;
  const isTooLong = value > max;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className={`text-sm font-bold ${isOptimal ? 'text-status-success' : value === 0 ? 'text-status-error' : 'text-status-warning'}`}>
          {value} car. {isOptimal ? '✓' : isTooShort ? '(trop court)' : isTooLong ? '(trop long)' : value === 0 ? '(manquant)' : ''}
        </span>
      </div>
      <div className="relative h-3 bg-gauge-track rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-status-success/20 border-l border-r border-status-success/40"
          style={{ left: `${optimalStart}%`, width: `${optimalEnd - optimalStart}%` }}
        />
        {value > 0 && (
          <div
            className={`h-full rounded-full transition-all ${isOptimal ? 'bg-status-success' : isTooShort ? 'bg-status-warning' : 'bg-status-error'}`}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-text-quaternary mt-1">
        <span>0</span>
        <span className="text-status-success/60">{min}–{max} optimal</span>
        <span>{total}</span>
      </div>
    </div>
  );
}

export default function HeadingsTab({ data, keywords, url }: { data: HeadingsAnalysis; keywords?: KeywordsAnalysis; url?: string }) {
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

  // Flatten hierarchy for display, limit to 20 unless expanded
  const allHeadingItems = headingGroups.flatMap(({ tag, items }) =>
    items.map((text, i) => ({ tag, text, i, level: parseInt(tag[1]) }))
  );
  const displayedHeadings = showAllHeadings ? allHeadingItems : allHeadingItems.slice(0, 20);

  return (
    <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6 md:p-8">
      <div className="space-y-10">

        {/* 1. Title & Meta Description Gauges (most actionable) */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Type className="text-text-tertiary" />
            Title & Meta Description
            <InfoBox
              items={[
                { term: 'Balise Title', definition: 'Le titre de votre page qui apparaît dans les résultats Google et dans l\'onglet du navigateur. C\'est l\'un des facteurs SEO les plus importants. Idéalement entre 50 et 60 caractères.' },
                { term: 'Meta Description', definition: 'Le texte descriptif affiché sous le titre dans les résultats de recherche. Elle n\'impacte pas directement le classement, mais un bon texte augmente le taux de clics. Visez 150 à 160 caractères.' },
                { term: 'H1 (Titre principal)', definition: 'Le titre principal de votre page, visible par les visiteurs. Chaque page doit avoir exactement un H1 unique qui décrit clairement le sujet.' },
                { term: 'H2, H3, H4...', definition: 'Les sous-titres qui structurent votre contenu. Ils créent une hiérarchie logique (comme un sommaire) et aident Google à comprendre l\'organisation de votre page. Ne sautez pas de niveau (ex : pas de H4 directement après un H2).' },
                { term: 'Aperçu SERP', definition: 'Simulation de l\'apparence de votre page dans les résultats Google. C\'est ce que les internautes voient avant de cliquer — un bon titre et une bonne description augmentent votre taux de clics.' },
              ]}
            />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-5">
              <div className="text-xs text-text-quaternary uppercase tracking-wider mb-3">Balise Title</div>
              <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                {data.title.content || <span className="text-status-error italic">Manquant</span>}
              </p>
              <LengthGauge value={data.title.length} min={50} max={60} label="Longueur" />
            </div>
            <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-5">
              <div className="text-xs text-text-quaternary uppercase tracking-wider mb-3">Meta Description</div>
              <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                {data.metaDescription.content || <span className="text-status-error italic">Manquante</span>}
              </p>
              <LengthGauge value={data.metaDescription.length} min={150} max={160} label="Longueur" />
            </div>
          </div>
        </div>

        {/* 2. SERP Preview */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Globe className="text-text-tertiary" />
            Aperçu SERP Google
          </h3>
          <div className="bg-white rounded-xl p-6 max-w-2xl">
            <div className="text-sm text-green-700 mb-1 truncate">
              {data.title.content ? (url || 'https://example.com') : '—'}
            </div>
            <h3 className="text-xl text-blue-800 hover:underline cursor-pointer mb-1 line-clamp-1" style={{ fontFamily: 'Arial, sans-serif' }}>
              {data.title.content || 'Titre manquant — Ajoutez une balise <title>'}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2" style={{ fontFamily: 'Arial, sans-serif' }}>
              {data.metaDescription.content || 'Aucune meta description disponible. Google affichera un extrait automatique de votre contenu.'}
            </p>
          </div>
        </div>

        {/* 3. Keyword Placement */}
        {keywords?.placement && (
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Target className="text-text-tertiary" />
              Placement du mot-clé principal
              <InfoBox
                items={[
                  { term: 'Mot-clé principal', definition: 'Le mot le plus pertinent et fréquent identifié automatiquement sur votre page. Il doit apparaître dans les zones clés (titre, H1, méta description, introduction) pour optimiser le référencement.' },
                  { term: 'Densité du mot-clé', definition: 'Le pourcentage d\'apparitions du mot-clé par rapport au nombre total de mots. Une densité entre 1% et 3% est optimale. En dessous, le mot-clé est sous-utilisé. Au-dessus, risque de suroptimisation (keyword stuffing).' },
                ]}
              />
            </h3>
            <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-5 mb-4">
              <div className="text-sm text-text-tertiary mb-3">
                Mot-clé détecté : <span className="font-bold text-text-primary">« {keywords.placement.primary} »</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Title', ok: keywords.placement.inTitle },
                  { label: 'H1', ok: keywords.placement.inH1 },
                  { label: 'Meta desc.', ok: keywords.placement.inMetaDescription },
                  { label: '100 premiers mots', ok: keywords.placement.inFirst100Words },
                ].map(check => (
                  <div key={check.label} className={`flex items-center justify-between p-3 rounded-lg border ${check.ok ? 'bg-status-success/5 border-status-success/20' : 'bg-status-error/5 border-status-error/20'}`}>
                    <span className="text-sm text-text-secondary">{check.label}</span>
                    {check.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
                    ) : (
                      <span className="text-status-error text-xs font-bold">ABSENT</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${
              keywords.placement.densityStatus === 'optimal' ? 'bg-status-success/5 border-status-success/20 text-status-success' :
              keywords.placement.densityStatus === 'low' ? 'bg-status-warning/5 border-status-warning/20 text-status-warning' :
              'bg-status-error/5 border-status-error/20 text-status-error'
            }`}>
              <span className="text-sm font-medium">
                Densité : {keywords.placement.density}% ({keywords.placement.keywordCount} occ. / {keywords.placement.totalWords} mots)
              </span>
              <span className="text-xs uppercase font-bold">
                {keywords.placement.densityStatus === 'optimal' ? 'Optimal' : keywords.placement.densityStatus === 'low' ? 'Faible' : 'Trop élevée'}
              </span>
            </div>
          </div>
        )}

        {/* 4. Issues (moved up) */}
        <IssuesList issues={data.issues} />

        {/* 4. Heading Count Summary */}
        <div>
          <h4 className="font-semibold text-text-primary mb-4">Résumé des Headings ({totalHeadings} total)</h4>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {headingGroups.map(({ tag, items }) => (
              <div key={tag} className="bg-surface-tertiary border border-border-secondary rounded-xl p-3 text-center">
                <div className="inline-block text-xs font-bold px-2 py-0.5 rounded-full text-text-secondary mb-2 bg-surface-secondary border border-border-secondary">
                  {tag}
                </div>
                <div className="text-2xl font-bold text-text-primary">{items.length}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Heading Hierarchy (collapsible, limit 20) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-text-primary">Structure hiérarchique</h4>
            {allHeadingItems.length > 20 && (
              <button
                onClick={() => setShowAllHeadings(!showAllHeadings)}
                className="text-xs px-3 py-1 rounded-lg bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-colors border border-border-secondary"
              >
                {showAllHeadings ? 'Réduire' : `Tout afficher (${allHeadingItems.length})`}
              </button>
            )}
          </div>
          <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-4 space-y-0.5">
            {totalHeadings === 0 ? (
              <p className="text-sm text-text-quaternary italic">Aucun heading trouvé sur la page</p>
            ) : (
              displayedHeadings.map(({ tag, text, i, level }) => (
                <div
                  key={`${tag}-${i}`}
                  className="flex items-center gap-3 py-2 hover:bg-surface-secondary rounded-lg px-2 transition-colors"
                  style={{ paddingLeft: `${(level - 1) * 24 + 8}px` }}
                >
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-surface-secondary text-text-tertiary border border-border-secondary flex-shrink-0">
                    {tag}
                  </span>
                  <span className="text-sm text-text-secondary truncate">
                    {text || <em className="text-status-error">Vide</em>}
                  </span>
                  {tag === 'H1' && i === 0 && (
                    <CheckCircle2 className="w-4 h-4 text-status-success flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <CTABanner variant="inline" />
      </div>
    </div>
  );
}
