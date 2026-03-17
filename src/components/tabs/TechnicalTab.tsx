'use client';

import { useState } from 'react';
import type { TechnicalAnalysis } from '@/lib/types';
import { CheckCircle2, Layout, Code2, FileCode, Gauge, Lock, Accessibility, Link as LinkIcon, Wifi, Shield, Smartphone, Monitor, Loader2 } from 'lucide-react';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-status-success';
  if (score >= 60) return 'text-status-warning';
  return 'text-status-error';
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function TechnicalTab({ data, cwvLoading }: { data: TechnicalAnalysis; cwvLoading?: boolean }) {
  const [showRobots, setShowRobots] = useState(false);
  const [showCssJs, setShowCssJs] = useState(false);
  const [cwvStrategy, setCwvStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const cwvData = data.coreWebVitals?.[cwvStrategy] ?? null;

  const htmlPercent = Math.min(100, (data.htmlSize / (2 * 1024 * 1024)) * 100);
  const htmlOk = data.htmlSize < 2 * 1024 * 1024;

  return (
    <div className="bg-surface-secondary border border-border-primary rounded-2xl p-6 md:p-8">
      <div className="space-y-10">

        {/* 1. Status checks */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Layout className="text-text-tertiary" />
            Analyse technique
            <InfoBox
              items={[
                { term: 'robots.txt', definition: 'Un fichier à la racine de votre site qui indique aux moteurs de recherche quelles pages explorer ou ignorer. Son absence n\'est pas bloquante mais sa présence permet un contrôle précis du crawl.' },
                { term: 'Sitemap XML', definition: 'Un fichier qui liste toutes les pages importantes de votre site. Il aide Google à découvrir vos pages plus rapidement, surtout pour les grands sites ou ceux avec peu de liens internes.' },
                { term: 'llms.txt', definition: 'Un fichier émergent qui aide les IA (ChatGPT, Perplexity, etc.) à comprendre votre site. C\'est l\'équivalent du robots.txt pour les moteurs de recherche IA — un avantage compétitif en GEO (Generative Engine Optimization).' },
                { term: 'Core Web Vitals', definition: 'Métriques de performance mesurées par Google : LCP (vitesse d\'affichage du contenu principal), CLS (stabilité visuelle), TBT (réactivité). Ils influencent directement votre classement Google.' },
                { term: 'LCP (Largest Contentful Paint)', definition: 'Le temps nécessaire pour afficher le plus grand élément visible (image, titre, etc.). Objectif : moins de 2,5 secondes.' },
                { term: 'CLS (Cumulative Layout Shift)', definition: 'Mesure les sauts de mise en page inattendus pendant le chargement. Un CLS élevé frustre les utilisateurs. Objectif : inférieur à 0,1.' },
                { term: 'Canonical', definition: 'Balise qui indique à Google quelle est la version « officielle » d\'une page, évitant les problèmes de contenu dupliqué.' },
              ]}
            />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Robots.txt</span>
              {data.robotsTxt.exists ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-error text-xs font-bold">ABSENT</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Sitemap dans robots</span>
              {data.sitemap.inRobots ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-error text-xs font-bold">NON</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Sitemap direct</span>
              {data.sitemap.exists ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-error text-xs font-bold">ABSENT</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">llms.txt</span>
              {data.llmsTxt.exists ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-error text-xs font-bold">ABSENT</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> HTTPS</span>
              {data.isHttps ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-error text-xs font-bold">NON</span>
              )}
            </div>
            {data.mixedContentCount > 0 && (
              <div className="flex items-center justify-between p-3 bg-status-warning/5 border border-status-warning/20 rounded-lg">
                <span className="text-sm text-text-secondary">Contenu mixte</span>
                <span className="text-status-warning text-sm font-bold">{data.mixedContentCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Core Web Vitals (moved up) */}
        {data.coreWebVitals && (data.coreWebVitals.mobile || data.coreWebVitals.desktop) ? (
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Gauge className="text-text-tertiary" />
              Core Web Vitals
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCwvStrategy('mobile')}
                  disabled={!data.coreWebVitals.mobile}
                  className={`p-1.5 rounded-lg transition-colors ${
                    cwvStrategy === 'mobile'
                      ? 'bg-surface-tertiary text-text-primary border border-border-primary'
                      : data.coreWebVitals.mobile
                        ? 'text-text-quaternary hover:text-text-secondary'
                        : 'text-text-quaternary/40 cursor-not-allowed'
                  }`}
                  title="Mobile"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCwvStrategy('desktop')}
                  disabled={!data.coreWebVitals.desktop}
                  className={`p-1.5 rounded-lg transition-colors ${
                    cwvStrategy === 'desktop'
                      ? 'bg-surface-tertiary text-text-primary border border-border-primary'
                      : data.coreWebVitals.desktop
                        ? 'text-text-quaternary hover:text-text-secondary'
                        : 'text-text-quaternary/40 cursor-not-allowed'
                  }`}
                  title="Desktop"
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
              <InfoBox
                items={[
                  { term: 'Performance', definition: 'Score global de performance sur 100 calculé par Google Lighthouse. Au-dessus de 90 c\'est excellent, entre 50 et 89 il y a des améliorations à faire, en dessous de 50 c\'est critique.' },
                  { term: 'LCP (Largest Contentful Paint)', definition: 'Temps d\'affichage du plus grand élément visible (image hero, titre principal). Bon : ≤ 2,5s. À améliorer : 2,5–4s. Mauvais : > 4s. C\'est le critère le plus important pour l\'expérience utilisateur.' },
                  { term: 'FCP (First Contentful Paint)', definition: 'Temps avant l\'affichage du premier contenu (texte ou image). Bon : ≤ 1,8s. À améliorer : 1,8–3s. Mauvais : > 3s. Un FCP rapide rassure l\'utilisateur que la page se charge.' },
                  { term: 'CLS (Cumulative Layout Shift)', definition: 'Mesure les décalages visuels inattendus pendant le chargement (boutons qui bougent, images qui poussent le texte). Bon : ≤ 0,1. À améliorer : 0,1–0,25. Mauvais : > 0,25.' },
                  { term: 'TBT (Total Blocking Time)', definition: 'Temps total pendant lequel la page est bloquée et ne répond pas aux clics. Bon : ≤ 200 ms. À améliorer : 200–600 ms. Mauvais : > 600 ms. Réduisez le JavaScript lourd.' },
                  { term: 'SI (Speed Index)', definition: 'Vitesse à laquelle le contenu visible se remplit progressivement. Bon : ≤ 3,4s. À améliorer : 3,4–5,8s. Mauvais : > 5,8s. Un bon SI signifie que l\'utilisateur voit du contenu rapidement.' },
                ]}
              />
            </h3>
            {cwvData ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: 'Performance', value: cwvData.performance, isScore: true },
                  { label: 'LCP', value: cwvData.lcp, unit: 'ms', good: 2500, poor: 4000, desc: 'Largest Contentful Paint' },
                  { label: 'FCP', value: cwvData.fcp, unit: 'ms', good: 1800, poor: 3000, desc: 'First Contentful Paint' },
                  { label: 'CLS', value: cwvData.cls, unit: '', good: 0.1, poor: 0.25, desc: 'Cumulative Layout Shift' },
                  { label: 'TBT', value: cwvData.tbt, unit: 'ms', good: 200, poor: 600, desc: 'Total Blocking Time' },
                  { label: 'SI', value: cwvData.si, unit: 'ms', good: 3400, poor: 5800, desc: 'Speed Index' },
                ].map((metric) => {
                  let color: string;
                  let display: string;
                  let status: string;
                  if (metric.isScore) {
                    color = getScoreColor(metric.value);
                    display = String(Math.round(metric.value));
                    status = metric.value >= 90 ? 'Bon' : metric.value >= 50 ? 'À améliorer' : 'Mauvais';
                  } else {
                    color = metric.value <= metric.good! ? 'text-status-success' : metric.value <= metric.poor! ? 'text-status-warning' : 'text-status-error';
                    if (metric.unit === 'ms') {
                      display = metric.value >= 1000 ? `${(metric.value / 1000).toFixed(1)}s` : `${Math.round(metric.value)} ms`;
                    } else {
                      display = metric.value.toFixed(2);
                    }
                    status = metric.value <= metric.good! ? 'Bon' : metric.value <= metric.poor! ? 'À améliorer' : 'Mauvais';
                  }
                  return (
                    <div key={metric.label} className="bg-surface-tertiary rounded-xl p-4 text-center border border-border-secondary">
                      <div className={`text-2xl font-bold mb-1 ${color}`}>{display}</div>
                      <div className="text-xs text-text-quaternary uppercase tracking-wider mb-1">{metric.label}</div>
                      {!metric.isScore && (
                        <div className={`text-xs ${color}`}>
                          {status}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-surface-tertiary border border-border-secondary rounded-xl">
                <span className="text-sm text-text-quaternary">Les données {cwvStrategy === 'mobile' ? 'mobile' : 'desktop'} ne sont pas disponibles.</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
              <Gauge className="text-text-tertiary" />
              Core Web Vitals
            </h3>
            {cwvLoading ? (
              <div className="flex items-center gap-3 p-4 bg-surface-tertiary border border-border-secondary rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" />
                <span className="text-sm text-text-tertiary">Analyse PageSpeed en cours...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-surface-tertiary border border-border-secondary rounded-xl">
                <span className="text-sm text-text-quaternary">Les données PageSpeed ne sont pas disponibles pour le moment. L&apos;API Google est peut-être surchargée — réessayez dans quelques minutes.</span>
              </div>
            )}
          </div>
        )}

        {/* 3. Issues */}
        <IssuesList issues={data.issues} />

        {/* 4. CMS, Tech Stack & HTML Size */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-4">
            <div className="text-xs text-text-quaternary uppercase tracking-wider mb-2">CMS</div>
            <div className="text-lg font-bold text-text-primary">{data.cms || 'Non détecté'}</div>
          </div>

          <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-4">
            <div className="text-xs text-text-quaternary uppercase tracking-wider mb-2">Tech Stack</div>
            <div className="flex flex-wrap gap-1.5">
              {data.technologies.length > 0 ? (
                data.technologies.map((tech) => (
                  <span key={tech} className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-secondary border border-border-secondary">
                    {tech}
                  </span>
                ))
              ) : (
                <span className="text-sm text-text-quaternary">Aucune détectée</span>
              )}
            </div>
          </div>

          <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-4">
            <div className="text-xs text-text-quaternary uppercase tracking-wider mb-2">Taille HTML</div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-lg font-bold ${htmlOk ? 'text-status-success' : 'text-status-error'}`}>
                {formatBytes(data.htmlSize)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${htmlOk ? 'bg-status-success/10 text-status-success' : 'bg-status-error/10 text-status-error'}`}>
                {htmlOk ? 'OK' : 'TROP GROS'}
              </span>
            </div>
            <div className="w-full bg-gauge-track h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${htmlOk ? 'bg-status-success' : 'bg-status-error'}`}
                style={{ width: `${Math.min(100, htmlPercent)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-quaternary mt-1">
              <span>0</span>
              <span>1 MB</span>
              <span>2 MB</span>
            </div>
          </div>
        </div>

        {/* 5. Technical tags */}
        <div>
          <h4 className="font-semibold text-text-primary mb-4">Balises techniques</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Canonical', value: data.canonical, exists: !!data.canonical },
              { label: 'Lang', value: data.lang, exists: !!data.lang },
              { label: 'Viewport', value: data.viewport ? 'Défini' : null, exists: !!data.viewport },
              { label: 'Charset', value: data.charset, exists: !!data.charset },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
                <div>
                  <span className="text-sm text-text-secondary">{item.label}</span>
                  {item.value && <p className="text-xs text-text-quaternary truncate max-w-[120px]">{item.value}</p>}
                </div>
                {item.exists ? (
                  <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-border-primary flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 5b. URL Structure */}
        <div>
          <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-text-tertiary" />
            Structure d&apos;URL
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Longueur</span>
              <span className={`text-sm font-bold ${data.urlStructure.length > 100 ? 'text-status-warning' : 'text-status-success'}`}>
                {data.urlStructure.length} car.
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Underscores</span>
              {data.urlStructure.hasUnderscores ? (
                <span className="text-status-warning text-xs font-bold">OUI</span>
              ) : (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Majuscules</span>
              {data.urlStructure.hasUppercase ? (
                <span className="text-status-warning text-xs font-bold">OUI</span>
              ) : (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Profondeur</span>
              <span className={`text-sm font-bold ${data.urlStructure.depth > 4 ? 'text-status-warning' : 'text-status-success'}`}>
                {data.urlStructure.depth} niv.
              </span>
            </div>
          </div>
        </div>

        {/* 6. CSS & JS Analysis (collapsible, default collapsed) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-text-primary">CSS & JavaScript</h4>
            <button
              onClick={() => setShowCssJs(!showCssJs)}
              className="text-xs px-3 py-1 rounded-lg bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-colors border border-border-secondary"
            >
              {showCssJs ? 'Masquer' : 'Afficher'}
            </button>
          </div>
          {showCssJs && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-text-tertiary" />
                  Analyse CSS
                </h4>
                <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-4">
                  <div className="text-2xl font-bold text-text-primary mb-3">{data.cssAnalysis.total} <span className="text-sm font-normal text-text-quaternary">Feuilles de style</span></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Styles en ligne</span>
                      <span className="text-text-secondary font-medium">{data.cssAnalysis.inline}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Feuilles de style locales</span>
                      <span className="text-text-secondary font-medium">{data.cssAnalysis.local}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Feuilles de style externes</span>
                      <span className="text-text-secondary font-medium">{data.cssAnalysis.external}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-text-tertiary" />
                  Couverture JavaScript
                </h4>
                <div className="bg-surface-tertiary border border-border-secondary rounded-xl p-4">
                  <div className="text-2xl font-bold text-text-primary mb-3">{data.jsAnalysis.total} <span className="text-sm font-normal text-text-quaternary">Scripts au total</span></div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Scripts en ligne</span>
                      <span className="text-text-secondary font-medium">{data.jsAnalysis.inline}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Scripts locaux</span>
                      <span className="text-text-secondary font-medium">{data.jsAnalysis.local}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Scripts externes</span>
                      <span className="text-text-secondary font-medium">{data.jsAnalysis.external}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Scripts bloquants</span>
                      <span className={`font-medium ${data.jsAnalysis.blocking > 5 ? 'text-status-error' : data.jsAnalysis.blocking > 0 ? 'text-status-warning' : 'text-status-success'}`}>
                        {data.jsAnalysis.blocking}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 7. robots.txt content (collapsible) */}
        {data.robotsTxt.exists && data.robotsTxt.content && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-text-primary">Contenu de robots.txt</h4>
              <button
                onClick={() => setShowRobots(!showRobots)}
                className="text-xs px-3 py-1 rounded-lg bg-surface-tertiary text-text-tertiary hover:text-text-primary transition-colors border border-border-secondary"
              >
                {showRobots ? 'Masquer' : 'Afficher'}
              </button>
            </div>
            {showRobots && (
              <pre className="bg-surface-tertiary border border-border-secondary rounded-xl p-4 text-sm text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                {data.robotsTxt.content}
              </pre>
            )}
          </div>
        )}

        {/* Resource Hints */}
        <div>
          <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-text-tertiary" />
            Resource Hints
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Preconnect', value: data.resourceHints.preconnect },
              { label: 'Preload', value: data.resourceHints.preload },
              { label: 'Prefetch', value: data.resourceHints.prefetch },
              { label: 'DNS-Prefetch', value: data.resourceHints.dnsPrefetch },
            ].map((hint) => (
              <div key={hint.label} className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
                <span className="text-sm text-text-secondary">{hint.label}</span>
                <span className={`text-sm font-bold ${hint.value > 0 ? 'text-status-success' : 'text-text-quaternary'}`}>
                  {hint.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* HTTP Headers */}
        <div>
          <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-text-tertiary" />
            Headers HTTP
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <div>
                <span className="text-sm text-text-secondary">X-Robots-Tag</span>
                {data.httpHeaders.xRobotsTag && (
                  <p className="text-xs text-text-quaternary truncate max-w-[120px]">{data.httpHeaders.xRobotsTag}</p>
                )}
              </div>
              {data.httpHeaders.xRobotsTag ? (
                data.httpHeaders.xRobotsTag.toLowerCase().includes('noindex') ? (
                  <span className="text-status-error text-xs font-bold">NOINDEX</span>
                ) : (
                  <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
                )
              ) : (
                <span className="text-text-quaternary text-xs">N/A</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Cache-Control</span>
              {data.httpHeaders.cacheControl ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-warning text-xs font-bold">ABSENT</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">CSP</span>
              {data.httpHeaders.contentSecurityPolicy ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-text-quaternary text-xs font-bold">ABSENT</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">HSTS</span>
              {data.httpHeaders.strictTransportSecurity ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-text-quaternary text-xs font-bold">ABSENT</span>
              )}
            </div>
          </div>
        </div>

        {/* PWA / Manifest */}
        <div>
          <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-text-tertiary" />
            PWA / Manifest
          </h4>
          <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg max-w-sm">
            <div>
              <span className="text-sm text-text-secondary">manifest.json</span>
              {data.manifest.href && (
                <p className="text-xs text-text-quaternary truncate max-w-[200px]">{data.manifest.href}</p>
              )}
            </div>
            {data.manifest.exists ? (
              <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
            ) : (
              <span className="text-text-quaternary text-xs font-bold">ABSENT</span>
            )}
          </div>
        </div>

        {/* Accessibility */}
        <div>
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <Accessibility className="text-text-tertiary" />
            Accessibilité
            <InfoBox
              items={[
                { term: 'HTTPS', definition: 'Protocole sécurisé obligatoire pour tout site web moderne. Google pénalise les sites HTTP depuis 2014. HTTPS protège les données des utilisateurs et est un signal de classement.' },
                { term: 'Contenu mixte', definition: 'Ressources (images, scripts) chargées en HTTP sur une page HTTPS. Cela déclenche des avertissements de sécurité dans les navigateurs et peut bloquer le chargement.' },
                { term: 'Skip Navigation', definition: 'Lien invisible (visible au focus clavier) qui permet aux utilisateurs de clavier et lecteurs d\'écran de sauter la navigation et aller directement au contenu principal.' },
                { term: 'Labels de formulaire', definition: 'Chaque champ de formulaire doit avoir un label associé (via l\'attribut for, aria-label ou en englobant l\'input dans un <label>). Essentiel pour les lecteurs d\'écran.' },
              ]}
            />
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Skip nav</span>
              {data.accessibility.hasSkipNav ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-warning text-xs font-bold">ABSENT</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Attr. lang</span>
              {data.accessibility.hasLangAttribute ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-error text-xs font-bold">ABSENT</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">Labels form</span>
              {data.accessibility.missingFormLabels === 0 ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-warning text-sm font-bold">{data.accessibility.missingFormLabels} manq.</span>
              )}
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-tertiary border border-border-secondary rounded-lg">
              <span className="text-sm text-text-secondary">ARIA boutons</span>
              {data.accessibility.missingButtonLabels === 0 ? (
                <CheckCircle2 className="text-status-success w-5 h-5 flex-shrink-0" />
              ) : (
                <span className="text-status-warning text-sm font-bold">{data.accessibility.missingButtonLabels} manq.</span>
              )}
            </div>
          </div>
        </div>

        <CTABanner variant="inline" />
      </div>
    </div>
  );
}
