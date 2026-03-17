'use client';

import type { MetadataAnalysis } from '@/lib/types';
import { CheckCircle2, Globe, Share2, Code2, Languages, Shield, AlertTriangle } from 'lucide-react';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';

function StatusBadge({ exists }: { exists: boolean }) {
  return exists ? (
    <span className="flex items-center gap-1.5 text-status-success text-sm font-medium">
      <CheckCircle2 className="w-4 h-4" />
      Défini
    </span>
  ) : (
    <span className="text-status-error text-sm font-medium">Manquant</span>
  );
}

export default function MetadataTab({ data }: { data: MetadataAnalysis }) {
  const metaChecks = [
    { label: 'og:title', value: data.ogTitle, exists: !!data.ogTitle },
    { label: 'og:description', value: data.ogDescription, exists: !!data.ogDescription },
    { label: 'og:image', value: data.ogImage ? 'Défini' : null, exists: !!data.ogImage },
    { label: 'og:url', value: data.ogUrl, exists: !!data.ogUrl },
    { label: 'og:type', value: data.ogType, exists: !!data.ogType },
    { label: 'twitter:card', value: data.twitterCard, exists: !!data.twitterCard },
    { label: 'twitter:title', value: data.twitterTitle, exists: !!data.twitterTitle },
    { label: 'twitter:image', value: data.twitterImage ? 'Défini' : null, exists: !!data.twitterImage },
    { label: 'favicon', value: data.favicon ? 'Détecté' : null, exists: !!data.favicon },
  ];

  const totalDefined = metaChecks.filter(m => m.exists).length;
  const completeness = Math.round((totalDefined / metaChecks.length) * 100);

  return (
    <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6 md:p-8">
      <div className="space-y-10">

        {/* 1. Completeness bar */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Share2 className="text-text-tertiary" />
            Métadonnées sociales
            <InfoBox
              items={[
                { term: 'Open Graph (og:)', definition: 'Balises qui contrôlent l\'apparence de votre page quand elle est partagée sur Facebook, LinkedIn ou WhatsApp. Sans elles, ces plateformes choisissent une image et un texte aléatoires.' },
                { term: 'Twitter Cards', definition: 'Équivalent d\'Open Graph pour Twitter/X. Elles permettent d\'afficher un aperçu riche (image, titre, description) quand votre lien est tweeté.' },
                { term: 'Favicon', definition: 'La petite icône qui apparaît dans l\'onglet du navigateur et les favoris. Elle renforce l\'identité visuelle et la confiance des utilisateurs.' },
                { term: 'Données structurées (JSON-LD)', definition: 'Du code invisible qui aide Google à comprendre le contenu de votre page (article, produit, FAQ, entreprise…). Elles peuvent déclencher des « rich snippets » — des résultats enrichis avec des étoiles, des prix, des FAQ, etc.' },
                { term: 'Directive Robots', definition: 'La balise meta robots indique à Google si la page doit être indexée (index/noindex) et si les liens doivent être suivis (follow/nofollow). Par défaut : index, follow.' },
                { term: 'Hreflang', definition: 'Balises qui indiquent les versions linguistiques de votre page. Essentielles si votre site est multilingue pour éviter que Google affiche la mauvaise version aux mauvais utilisateurs.' },
              ]}
            />
          </h3>
          <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">Complétude des métadonnées</span>
              <span className={`text-lg font-bold ${completeness >= 80 ? 'text-status-success' : completeness >= 50 ? 'text-status-warning' : 'text-status-error'}`}>
                {totalDefined}/{metaChecks.length} ({completeness}%)
              </span>
            </div>
            <div className="w-full bg-gauge-track h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${completeness >= 80 ? 'bg-status-success' : completeness >= 50 ? 'bg-status-warning' : 'bg-status-error'}`}
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2. Social Previews */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Facebook/OG Preview */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-text-tertiary" />
              Aperçu Facebook / LinkedIn
            </h4>
            <div className="rounded-xl overflow-hidden border border-border-primary bg-[#f0f2f5]">
              {data.ogImage ? (
                <div className="h-44 overflow-hidden bg-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(data.ogImage)}`}
                    alt="OG Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="h-44 bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Aucune image OG</span>
                </div>
              )}
              <div className="p-3 bg-[#e4e6eb]">
                <p className="text-xs text-gray-500 uppercase mb-0.5">{data.ogUrl ? (() => { try { return new URL(data.ogUrl!).hostname; } catch { return data.ogUrl; } })() : '—'}</p>
                <p className="text-sm font-semibold text-gray-900 mb-0.5 line-clamp-1">{data.ogTitle || 'Pas de titre OG'}</p>
                <p className="text-xs text-gray-600 line-clamp-2">{data.ogDescription || 'Pas de description OG'}</p>
              </div>
            </div>
          </div>

          {/* Twitter Preview */}
          <div>
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <span className="text-text-tertiary text-lg font-bold">&#x1D54F;</span>
              Aperçu Twitter / X
            </h4>
            <div className="rounded-xl overflow-hidden border border-border-primary bg-black">
              {(data.twitterImage || data.ogImage) ? (
                <div className="h-44 overflow-hidden bg-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/image-proxy?url=${encodeURIComponent(data.twitterImage || data.ogImage || '')}`}
                    alt="Twitter Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="h-44 bg-gray-800 flex items-center justify-center">
                  <span className="text-gray-600 text-sm">Aucune image Twitter</span>
                </div>
              )}
              <div className="p-3 border-t border-white/10">
                <p className="text-sm font-semibold text-white mb-0.5 line-clamp-1">{data.twitterTitle || data.ogTitle || 'Pas de titre'}</p>
                <p className="text-xs text-gray-500 line-clamp-2">{data.twitterDescription || data.ogDescription || 'Pas de description'}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Card: <span className="text-gray-400">{data.twitterCard || 'Non défini'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Issues (moved up) */}
        <IssuesList issues={data.issues} />

        {/* 4. Meta Tags Checklist */}
        <div>
          <h4 className="font-semibold text-text-primary mb-4">Vérification des balises</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {metaChecks.map((meta) => (
              <div key={meta.label} className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-text-secondary font-mono">{meta.label}</span>
                  {meta.value && meta.exists && meta.label !== 'og:image' && meta.label !== 'twitter:image' && meta.label !== 'favicon' && (
                    <p className="text-xs text-text-quaternary truncate mt-0.5">{meta.value}</p>
                  )}
                </div>
                <StatusBadge exists={meta.exists} />
              </div>
            ))}
          </div>
        </div>

        {/* 4b. Duplicate Metadata */}
        {data.duplicates && (data.duplicates.titleCount > 1 || data.duplicates.descriptionCount > 1 || !data.duplicates.titleMatchesOg) && (
          <div>
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              Métadonnées dupliquées
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.duplicates.titleCount > 1 && (
                <div className="flex items-center justify-between p-4 bg-status-warning/5 border border-status-warning/20 rounded-xl">
                  <div>
                    <div className="text-sm text-text-secondary">Balises &lt;title&gt;</div>
                    <div className="text-xs text-text-quaternary">Une seule recommandée</div>
                  </div>
                  <div className="text-2xl font-bold text-status-warning">{data.duplicates.titleCount}x</div>
                </div>
              )}
              {data.duplicates.descriptionCount > 1 && (
                <div className="flex items-center justify-between p-4 bg-status-warning/5 border border-status-warning/20 rounded-xl">
                  <div>
                    <div className="text-sm text-text-secondary">Meta description</div>
                    <div className="text-xs text-text-quaternary">Une seule recommandée</div>
                  </div>
                  <div className="text-2xl font-bold text-status-warning">{data.duplicates.descriptionCount}x</div>
                </div>
              )}
              {!data.duplicates.titleMatchesOg && (
                <div className="flex items-center justify-between p-4 bg-surface-tertiary border border-border-secondary rounded-xl">
                  <div>
                    <div className="text-sm text-text-secondary">Title ≠ og:title</div>
                    <div className="text-xs text-text-quaternary">Vérifiez la cohérence</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-status-warning/10 text-status-warning border border-status-warning/20 font-bold">DIFFÉRENT</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. Robots + Structured data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-5">
            <h4 className="font-semibold text-text-primary mb-3">Directive Robots</h4>
            {data.robots ? (
              <div className="flex flex-wrap gap-2">
                {data.robots.split(',').map((directive, i) => {
                  const d = directive.trim().toLowerCase();
                  const isNegative = d.includes('noindex') || d.includes('nofollow') || d.includes('none');
                  return (
                    <span
                      key={i}
                      className={`text-xs px-3 py-1 rounded-full border ${isNegative ? 'bg-status-error/10 text-status-error border-status-error/20' : 'bg-status-success/10 text-status-success border-status-success/20'}`}
                    >
                      {directive.trim()}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-text-quaternary">Aucune directive robots — par défaut : index, follow</p>
            )}
          </div>

          <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-5">
            <h4 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-text-tertiary" />
              Données structurées (JSON-LD)
            </h4>
            {data.structuredData.exists ? (
              <div className="flex flex-wrap gap-2">
                {data.structuredData.types.map((type) => (
                  <span key={type} className="text-xs px-3 py-1 rounded-full bg-surface-secondary text-text-secondary border border-border-secondary">
                    {type}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-quaternary">Aucune donnée structurée détectée</p>
            )}
          </div>
        </div>

        {/* 6. Hreflang */}
        {data.hreflang.length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Languages className="w-4 h-4 text-text-tertiary" />
              Balises Hreflang ({data.hreflang.length})
            </h4>
            <div className="space-y-2">
              {data.hreflang.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
                  <span className="text-sm font-bold text-text-primary px-2 py-0.5 rounded bg-surface-secondary">{h.lang}</span>
                  <span className="text-xs text-text-tertiary font-mono truncate ml-4">{h.href}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. E-E-A-T Signals */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Shield className="text-text-tertiary" />
            Signaux E-E-A-T ({data.eeat.signalCount}/5)
            <InfoBox
              items={[
                { term: 'E-E-A-T', definition: 'Experience, Expertise, Authoritativeness, Trustworthiness — les critères de qualité de Google pour évaluer la fiabilité d\'un contenu. Plus votre page affiche ces signaux, mieux elle sera perçue par Google.' },
                { term: 'Auteur identifié', definition: 'Indiquer l\'auteur du contenu (via JSON-LD, balise author, ou élément visible) renforce la crédibilité. Essentiel pour les contenus YMYL (santé, finance, juridique).' },
                { term: 'Dates de publication', definition: 'Les dates de publication et de modification montrent que le contenu est actuel et maintenu. Google favorise les contenus récents et mis à jour.' },
                { term: 'Politique de confidentialité', definition: 'Obligatoire en Europe (RGPD). Son absence peut être un signal négatif pour Google et pénaliser la confiance des utilisateurs.' },
              ]}
            />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <div>
                <span className="text-sm text-text-secondary">Auteur</span>
                {data.eeat.authorName && <p className="text-xs text-text-quaternary">{data.eeat.authorName}</p>}
              </div>
              {data.eeat.hasAuthor ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-text-quaternary text-xs font-bold">NON</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <div>
                <span className="text-sm text-text-secondary">Date de publication</span>
                {data.eeat.publishedDate && <p className="text-xs text-text-quaternary">{data.eeat.publishedDate}</p>}
              </div>
              {data.eeat.hasPublishedDate ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-text-quaternary text-xs font-bold">NON</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <div>
                <span className="text-sm text-text-secondary">Date de modification</span>
                {data.eeat.modifiedDate && <p className="text-xs text-text-quaternary">{data.eeat.modifiedDate}</p>}
              </div>
              {data.eeat.hasModifiedDate ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-text-quaternary text-xs font-bold">NON</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Lien contact / à propos</span>
              {data.eeat.hasContactLink ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-text-quaternary text-xs font-bold">NON</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Politique de confidentialité</span>
              {data.eeat.hasPrivacyPolicy ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-warning text-xs font-bold">ABSENT</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Mentions légales / CGU</span>
              {data.eeat.hasTermsOfService ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-text-quaternary text-xs font-bold">NON</span>
              )}
            </div>
          </div>
        </div>

        <CTABanner variant="inline" />
      </div>
    </div>
  );
}
