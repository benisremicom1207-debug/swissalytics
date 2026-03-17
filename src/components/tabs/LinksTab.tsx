'use client';

import { useState } from 'react';
import type { LinksAnalysis, LinkInfo } from '@/lib/types';
import { Link2, ExternalLink, ArrowRightLeft, AlertTriangle } from 'lucide-react';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';

function LinkTable({ links, title, icon }: { links: LinkInfo[]; title: string; icon: React.ReactNode }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? links : links.slice(0, 10);

  if (links.length === 0) return null;
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-text-primary flex items-center gap-2">
          {icon}
          {title} ({links.length})
        </h4>
        {links.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs px-3 py-1 rounded-lg bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-colors border border-border-secondary"
          >
            {showAll ? 'Réduire' : `Tout afficher (${links.length})`}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-quaternary border-b border-border-primary">
              <th className="text-left pb-3 pr-4 font-medium">URL</th>
              <th className="text-left pb-3 pr-4 font-medium">Texte d&apos;ancrage</th>
              <th className="text-left pb-3 font-medium">Attributs</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((link, i) => (
              <tr key={i} className="border-b border-border-secondary hover:bg-surface-tertiary transition-colors">
                <td className="py-2.5 pr-4 text-text-secondary max-w-[280px]">
                  <span className="truncate block text-xs font-mono">{link.href}</span>
                </td>
                <td className="py-2.5 pr-4 max-w-[200px]">
                  {link.text ? (
                    <span className="text-text-tertiary truncate block">{link.text}</span>
                  ) : (
                    <em className="text-status-warning text-xs">Aucun texte</em>
                  )}
                </td>
                <td className="py-2.5">
                  <div className="flex gap-1.5 flex-wrap">
                    {link.isNofollow && <span className="text-xs px-2 py-0.5 rounded-full bg-status-error/10 text-status-error border border-status-error/20">nofollow</span>}
                    {link.isSponsored && <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-tertiary border border-border-secondary">sponsored</span>}
                    {link.isUgc && <span className="text-xs px-2 py-0.5 rounded-full bg-surface-tertiary text-text-tertiary border border-border-secondary">ugc</span>}
                    {!link.isNofollow && !link.isSponsored && !link.isUgc && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-status-success/10 text-status-success border border-status-success/20">dofollow</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LinksTab({ data }: { data: LinksAnalysis }) {
  const internalPercent = data.total > 0 ? Math.round((data.internal.length / data.total) * 100) : 0;
  const externalPercent = data.total > 0 ? Math.round((data.external.length / data.total) * 100) : 0;

  return (
    <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6 md:p-8">
      <div className="space-y-10">

        {/* 1. Stats Grid */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Link2 className="text-text-tertiary" />
            Analyse des Liens
            <InfoBox
              items={[
                { term: 'Liens internes', definition: 'Liens qui pointent vers d\'autres pages de votre propre site. Ils aident Google à découvrir et comprendre la structure de votre site, et transmettent de l\'autorité entre vos pages.' },
                { term: 'Liens externes', definition: 'Liens qui pointent vers d\'autres sites web. Ils montrent à Google que vous citez des sources fiables. Visez un bon équilibre entre liens internes et externes.' },
                { term: 'Texte d\'ancrage', definition: 'Le texte cliquable d\'un lien. Évitez les textes génériques comme « cliquez ici » ou « en savoir plus ». Utilisez des textes descriptifs qui indiquent le contenu de la page cible (ex : « notre guide SEO complet »).' },
                { term: 'Dofollow / Nofollow', definition: 'Un lien « dofollow » (par défaut) transmet de l\'autorité SEO à la page cible. Un lien « nofollow » dit à Google de ne pas suivre ce lien. Utilisez nofollow pour les liens sponsorisés ou non fiables.' },
                { term: 'Ancres vides', definition: 'Liens sans texte visible — souvent des images non optimisées utilisées comme liens. Ils empêchent Google de comprendre la destination du lien.' },
                { term: 'Liens cassés', definition: 'Liens qui mènent vers des pages inexistantes (erreur 404) ou en erreur (5xx). Ils nuisent à l\'expérience utilisateur et gaspillent le budget de crawl de Google. Corrigez-les ou supprimez-les.' },
              ]}
            />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className="text-2xl font-bold text-text-primary mb-1">{data.total}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Total liens</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className="text-2xl font-bold text-text-primary mb-1">{data.internal.length}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Internes</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className="text-2xl font-bold text-text-primary mb-1">{data.external.length}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Externes</div>
            </div>
            <div className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
              <div className="text-2xl font-bold text-text-primary mb-1">{data.uniqueAnchors}</div>
              <div className="text-xs text-text-quaternary uppercase tracking-wider">Ancres uniques</div>
            </div>
          </div>
        </div>

        {/* 2. Anchor Text Quality (moved up — most actionable) */}
        {(data.emptyAnchors > 0 || data.genericAnchors > 0) && (
          <div>
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              Qualité des textes d&apos;ancrage
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.emptyAnchors > 0 && (
                <div className="flex items-center justify-between p-4 bg-status-error/5 border border-status-error/20 rounded-xl">
                  <div>
                    <div className="text-sm text-text-secondary">Ancres vides</div>
                    <div className="text-xs text-text-quaternary">Liens sans texte ni image</div>
                  </div>
                  <div className="text-2xl font-bold text-status-error">{data.emptyAnchors}</div>
                </div>
              )}
              {data.genericAnchors > 0 && (
                <div className="flex items-center justify-between p-4 bg-status-warning/5 border border-status-warning/20 rounded-xl">
                  <div>
                    <div className="text-sm text-text-secondary">Ancres génériques</div>
                    <div className="text-xs text-text-quaternary">&quot;Cliquez ici&quot;, &quot;En savoir plus&quot;...</div>
                  </div>
                  <div className="text-2xl font-bold text-status-warning">{data.genericAnchors}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. Issues */}
        <IssuesList issues={data.issues} />

        {/* 4. Ratio bar (2-tone) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-5">
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-text-tertiary" />
              Ratio interne / externe
            </h4>
            {data.total > 0 ? (
              <>
                <div className="flex h-4 rounded-full overflow-hidden mb-4">
                  <div className="bg-accent transition-all" style={{ width: `${internalPercent}%` }} />
                  <div className="bg-border-primary transition-all" style={{ width: `${externalPercent}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-text-tertiary">Internes</span>
                    <span className="text-text-primary font-bold">{internalPercent}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-border-primary" />
                    <span className="text-text-tertiary">Externes</span>
                    <span className="text-text-primary font-bold">{externalPercent}%</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-text-quaternary italic">Aucun lien détecté</p>
            )}
          </div>

          <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-5">
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-text-tertiary" />
              Attributs des liens
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-success" />
                  <span className="text-sm text-text-tertiary">Dofollow</span>
                </div>
                <span className="text-sm font-bold text-status-success">{data.dofollow}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-error" />
                  <span className="text-sm text-text-tertiary">Nofollow</span>
                </div>
                <span className="text-sm font-bold text-status-error">{data.nofollow}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-status-warning" />
                  <span className="text-sm text-text-tertiary">Avec images</span>
                </div>
                <span className="text-sm font-bold text-status-warning">{data.withImages}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5a. Internal broken links */}
        {data.internalBrokenLinks && data.internalBrokenLinks.length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-error" />
              Liens internes cassés ({data.internalBrokenLinks.length})
            </h4>
            <div className="space-y-2">
              {data.internalBrokenLinks.map((link, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
                  <span className="text-sm text-text-secondary font-mono truncate max-w-[400px]">{link.href}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    link.status === 404 ? 'bg-status-error/10 text-status-error border border-status-error/20' :
                    link.status >= 500 ? 'bg-status-warning/10 text-status-warning border border-status-warning/20' :
                    'bg-surface-secondary text-text-quaternary border border-border-secondary'
                  }`}>
                    {link.status === 0 ? (link.error || 'timeout') : link.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5b. External broken links */}
        {data.brokenLinks.length > 0 && (
          <div>
            <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-status-error" />
              Liens externes cassés ({data.brokenLinks.length})
            </h4>
            <div className="space-y-2">
              {data.brokenLinks.map((link, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
                  <span className="text-sm text-text-secondary font-mono truncate max-w-[400px]">{link.href}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    link.status === 404 ? 'bg-status-error/10 text-status-error border border-status-error/20' :
                    link.status >= 500 ? 'bg-status-warning/10 text-status-warning border border-status-warning/20' :
                    'bg-surface-secondary text-text-quaternary border border-border-secondary'
                  }`}>
                    {link.status === 0 ? (link.error || 'timeout') : link.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Link tables (default 10 rows) */}
        <LinkTable
          links={data.internal}
          title="Liens internes"
          icon={<Link2 className="w-4 h-4 text-text-tertiary" />}
        />
        <LinkTable
          links={data.external}
          title="Liens externes"
          icon={<ExternalLink className="w-4 h-4 text-text-tertiary" />}
        />

        <CTABanner variant="inline" />
      </div>
    </div>
  );
}
