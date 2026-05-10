'use client';

import { useState } from 'react';
import type { TechnicalAnalysis } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import {
  groupTechsByCategory,
  CATEGORY_LABELS,
  type TechCategory,
} from '@/lib/analyzer/tech-categories';
import IssuesList from '../IssuesList';
import CTABanner from '../CTABanner';
import InfoBox from '../InfoBox';
import { SectionHeader, CheckPill, MonoCard, TabFrame } from './_v2';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function metricColor(value: number, good: number, poor: number): string {
  return value <= good ? 'var(--sa-ok)' : value <= poor ? 'var(--sa-warn)' : 'var(--sa-red)';
}

function scoreColor(score: number): string {
  if (score >= 80) return 'var(--sa-ok)';
  if (score >= 60) return 'var(--sa-warn)';
  return 'var(--sa-red)';
}

const CATEGORY_DOT: Record<TechCategory, string> = {
  framework: 'var(--sa-ink)',
  library: 'var(--sa-ink-3)',
  analytics: 'var(--sa-warn)',
  embed: 'var(--sa-red)',
  other: 'var(--sa-ink-4)',
};

export default function TechnicalTab({ data, cwvLoading }: { data: TechnicalAnalysis; cwvLoading?: boolean }) {
  const [showRobots, setShowRobots] = useState(false);
  const [showCssJs, setShowCssJs] = useState(false);
  const [cwvStrategy, setCwvStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const cwvData = data.coreWebVitals?.[cwvStrategy] ?? null;
  const hasCwv = data.coreWebVitals && (data.coreWebVitals.mobile || data.coreWebVitals.desktop);

  const htmlPercent = Math.min(100, (data.htmlSize / (2 * 1024 * 1024)) * 100);
  const htmlOk = data.htmlSize < 2 * 1024 * 1024;
  const htmlColor = htmlOk ? 'var(--sa-ok)' : 'var(--sa-red)';

  const techGroups = groupTechsByCategory(data.technologies);

  return (
    <TabFrame>
      {/* §01 — Indexabilité (robots.txt, sitemap, llms.txt, https) */}
      <section>
        <SectionHeader
          num="01"
          title="Indexabilité & sécurité"
          info={
            <InfoBox
              items={[
                { term: 'robots.txt', definition: "Un fichier à la racine de votre site qui indique aux moteurs de recherche quelles pages explorer ou ignorer. Son absence n'est pas bloquante mais sa présence permet un contrôle précis du crawl." },
                { term: 'Sitemap XML', definition: 'Un fichier qui liste toutes les pages importantes de votre site. Il aide Google à découvrir vos pages plus rapidement.' },
                { term: 'llms.txt', definition: "Un fichier émergent qui aide les IA (ChatGPT, Perplexity, etc.) à comprendre votre site. C'est l'équivalent du robots.txt pour les moteurs IA — un avantage compétitif en GEO." },
                { term: 'HTTPS', definition: 'Protocole sécurisé obligatoire. Google pénalise les sites HTTP depuis 2014.' },
                { term: 'Contenu mixte', definition: 'Ressources HTTP chargées sur une page HTTPS — déclenche des avertissements navigateurs.' },
              ]}
            />
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <CheckPill label="Robots.txt" ok={data.robotsTxt.exists} />
          <CheckPill label="Sitemap dans robots" ok={!!data.sitemap.inRobots} status={data.sitemap.inRobots ? '✓ OK' : 'NON'} />
          <CheckPill label="Sitemap direct" ok={data.sitemap.exists} />
          <CheckPill label="llms.txt" ok={data.llmsTxt.exists} />
          <CheckPill label="HTTPS" ok={data.isHttps} status={data.isHttps ? '✓ OK' : 'NON'} />
          {data.mixedContentCount > 0 && (
            <CheckPill label="Contenu mixte" ok={false} tone="warn" status={`${data.mixedContentCount} fichiers`} />
          )}
        </div>
      </section>

      {/* §02 — Core Web Vitals */}
      <section>
        <SectionHeader
          num="02"
          title="Core Web Vitals"
          rightSlot={
            hasCwv ? (
              <div style={{ display: 'flex', gap: 0, border: '1px solid var(--sa-ink)' }}>
                {(['mobile', 'desktop'] as const).map((s) => {
                  const active = cwvStrategy === s;
                  const enabled = !!data.coreWebVitals?.[s];
                  return (
                    <button
                      key={s}
                      onClick={() => enabled && setCwvStrategy(s)}
                      disabled={!enabled}
                      className="mono"
                      style={{
                        padding: '6px 12px',
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        background: active ? 'var(--sa-ink)' : 'var(--sa-cream)',
                        color: active ? 'var(--sa-cream)' : enabled ? 'var(--sa-ink)' : 'var(--sa-ink-4)',
                        border: 'none',
                        cursor: enabled ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            ) : null
          }
          info={
            <InfoBox
              items={[
                { term: 'Performance', definition: 'Score global sur 100 calculé par Google Lighthouse. >90 excellent, 50-89 améliorable, <50 critique.' },
                { term: 'LCP', definition: "Largest Contentful Paint — temps d'affichage du plus grand élément. Bon : ≤ 2,5s." },
                { term: 'FCP', definition: 'First Contentful Paint — temps avant le premier contenu. Bon : ≤ 1,8s.' },
                { term: 'CLS', definition: 'Cumulative Layout Shift — décalages visuels. Bon : ≤ 0,1.' },
                { term: 'TBT', definition: "Total Blocking Time — temps où la page ne répond pas. Bon : ≤ 200 ms." },
                { term: 'SI', definition: 'Speed Index — vitesse de remplissage visuel. Bon : ≤ 3,4s.' },
              ]}
            />
          }
        />
        {hasCwv && cwvData ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Performance', value: cwvData.performance, isScore: true },
              { label: 'LCP', value: cwvData.lcp, unit: 'ms', good: 2500, poor: 4000 },
              { label: 'FCP', value: cwvData.fcp, unit: 'ms', good: 1800, poor: 3000 },
              { label: 'CLS', value: cwvData.cls, unit: '',   good: 0.1,  poor: 0.25 },
              { label: 'TBT', value: cwvData.tbt, unit: 'ms', good: 200,  poor: 600 },
              { label: 'SI',  value: cwvData.si,  unit: 'ms', good: 3400, poor: 5800 },
            ].map((m) => {
              let color: string, display: string, status: string;
              if (m.isScore) {
                color = scoreColor(m.value);
                display = String(Math.round(m.value));
                status = m.value >= 90 ? 'Bon' : m.value >= 50 ? 'À améliorer' : 'Mauvais';
              } else {
                color = metricColor(m.value, m.good!, m.poor!);
                display = m.unit === 'ms'
                  ? (m.value >= 1000 ? `${(m.value / 1000).toFixed(1)}s` : `${Math.round(m.value)} ms`)
                  : m.value.toFixed(2);
                status = m.value <= m.good! ? 'Bon' : m.value <= m.poor! ? 'À améliorer' : 'Mauvais';
              }
              return (
                <div
                  key={m.label}
                  style={{
                    border: '1px solid var(--sa-rule)',
                    background: 'var(--sa-cream-2)',
                    padding: 14,
                    textAlign: 'center',
                  }}
                >
                  <div className="display tnum" style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>
                    {display}
                  </div>
                  <div className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-4)', fontWeight: 700, marginBottom: 4 }}>
                    {m.label}
                  </div>
                  {!m.isScore && (
                    <div className="mono" style={{ fontSize: 10, color, fontWeight: 600, letterSpacing: '0.06em' }}>
                      {status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <MonoCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--sa-ink-3)' }}>
              {cwvLoading && <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: 'var(--sa-ink-4)' }} />}
              {cwvLoading
                ? 'Analyse PageSpeed en cours…'
                : "Données PageSpeed indisponibles. L'API Google est peut-être surchargée — réessayez dans quelques minutes."}
            </div>
          </MonoCard>
        )}
      </section>

      {/* §03 — Issues */}
      <IssuesList issues={data.issues} />

      {/* §04 — CMS / HTML size */}
      <section>
        <SectionHeader num="04" title="Profil du site" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <MonoCard caption="CMS détecté">
            <div style={{ fontSize: 18, fontWeight: 700, color: data.cms ? 'var(--sa-ink)' : 'var(--sa-ink-4)' }}>
              {data.cms || 'Non détecté'}
            </div>
          </MonoCard>
          <MonoCard caption="Taille HTML">
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
              <span className="display tnum" style={{ fontSize: 22, fontWeight: 800, color: htmlColor, lineHeight: 1 }}>
                {formatBytes(data.htmlSize)}
              </span>
              <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: htmlColor }}>
                {htmlOk ? 'OK' : 'TROP GROS'}
              </span>
            </div>
            <div style={{ position: 'relative', height: 8, background: 'var(--sa-cream-3)', border: '1px solid var(--sa-rule)' }}>
              <div style={{ height: '100%', width: `${Math.min(100, htmlPercent)}%`, background: htmlColor }} />
            </div>
            <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--sa-ink-4)', marginTop: 4, letterSpacing: '0.08em' }}>
              <span>0</span><span>1 MB</span><span>2 MB</span>
            </div>
          </MonoCard>
        </div>
      </section>

      {/* §05 — Technologies détectées (catégorisé) */}
      <section>
        <SectionHeader
          num="05"
          title="Technologies détectées"
          info={
            <InfoBox
              items={[
                { term: 'Framework JS', definition: "Bibliothèque JavaScript principale qui pilote l'interface (React, Vue, Angular). Définit l'architecture front-end." },
                { term: 'Bibliothèques', definition: 'Outils utilitaires (jQuery, Bootstrap, Tailwind, animations). Peuvent alourdir la page si redondants.' },
                { term: 'Analytics & tracking', definition: 'Outils de mesure (GA, GTM, Meta Pixel, Hotjar). Impactent le RGPD et la performance — vérifier la consentement.' },
                { term: 'Embeds & widgets', definition: 'Contenus tiers intégrés (vidéos YouTube/Vimeo, cartes Google Maps, chats Intercom). Pas partie du stack mais ralentissent le chargement.' },
              ]}
            />
          }
        />
        {techGroups.length === 0 ? (
          <MonoCard>
            <div style={{ fontSize: 13, color: 'var(--sa-ink-4)' }}>Aucune technologie détectée dans le HTML statique.</div>
          </MonoCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {techGroups.map(({ category, techs }) => (
              <div
                key={category}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: 16,
                  padding: '12px 16px',
                  border: '1px solid var(--sa-rule)',
                  background: 'var(--sa-cream-2)',
                  alignItems: 'start',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, background: CATEGORY_DOT[category], flexShrink: 0 }} />
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sa-ink-3)', fontWeight: 700 }}>
                    {CATEGORY_LABELS[category].fr}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {techs.map((t) => (
                    <span
                      key={t}
                      className="mono"
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        padding: '4px 10px',
                        border: '1px solid var(--sa-rule)',
                        background: 'var(--sa-cream)',
                        color: 'var(--sa-ink)',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* §06 — Balises techniques */}
      <section>
        <SectionHeader num="06" title="Balises techniques" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <CheckPill label="Canonical" ok={!!data.canonical} value={data.canonical} />
          <CheckPill label="Lang" ok={!!data.lang} value={data.lang} />
          <CheckPill label="Viewport" ok={!!data.viewport} value={data.viewport ? 'Défini' : null} />
          <CheckPill label="Charset" ok={!!data.charset} value={data.charset} />
        </div>
      </section>

      {/* §07 — URL Structure */}
      <section>
        <SectionHeader num="07" title="Structure d'URL" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <CheckPill
            label="Longueur"
            ok={data.urlStructure.length <= 100}
            tone="warn"
            status={`${data.urlStructure.length} car.`}
          />
          <CheckPill label="Underscores" ok={!data.urlStructure.hasUnderscores} tone="warn" status={data.urlStructure.hasUnderscores ? 'OUI' : '✓ OK'} />
          <CheckPill label="Majuscules" ok={!data.urlStructure.hasUppercase} tone="warn" status={data.urlStructure.hasUppercase ? 'OUI' : '✓ OK'} />
          <CheckPill
            label="Profondeur"
            ok={data.urlStructure.depth <= 4}
            tone="warn"
            status={`${data.urlStructure.depth} niv.`}
          />
        </div>
      </section>

      {/* §08 — CSS & JS (collapsible) */}
      <section>
        <SectionHeader
          num="08"
          title="CSS & JavaScript"
          rightSlot={
            <button
              onClick={() => setShowCssJs(!showCssJs)}
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
              {showCssJs ? 'Masquer' : 'Afficher'}
            </button>
          }
        />
        {showCssJs && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            <MonoCard caption="Analyse CSS">
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--sa-ink)', marginBottom: 10 }}>
                {data.cssAnalysis.total} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sa-ink-4)' }}>feuilles de style</span>
              </div>
              {[
                ['Styles en ligne', data.cssAnalysis.inline],
                ['Locales', data.cssAnalysis.local],
                ['Externes', data.cssAnalysis.external],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--sa-ink-3)', padding: '4px 0' }}>
                  <span>{label}</span>
                  <span className="tnum" style={{ fontWeight: 600, color: 'var(--sa-ink)' }}>{value}</span>
                </div>
              ))}
            </MonoCard>
            <MonoCard caption="Couverture JavaScript">
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--sa-ink)', marginBottom: 10 }}>
                {data.jsAnalysis.total} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sa-ink-4)' }}>scripts au total</span>
              </div>
              {[
                ['En ligne', data.jsAnalysis.inline, undefined],
                ['Locaux',  data.jsAnalysis.local, undefined],
                ['Externes',data.jsAnalysis.external, undefined],
                ['Bloquants', data.jsAnalysis.blocking, data.jsAnalysis.blocking > 5 ? 'var(--sa-red)' : data.jsAnalysis.blocking > 0 ? 'var(--sa-warn)' : 'var(--sa-ok)'],
              ].map(([label, value, color]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--sa-ink-3)', padding: '4px 0' }}>
                  <span>{label}</span>
                  <span className="tnum" style={{ fontWeight: 700, color: (color as string) ?? 'var(--sa-ink)' }}>{value as number}</span>
                </div>
              ))}
            </MonoCard>
          </div>
        )}
      </section>

      {/* §09 — robots.txt content (collapsible, only when present) */}
      {data.robotsTxt.exists && data.robotsTxt.content && (
        <section>
          <SectionHeader
            num="09"
            title="Contenu de robots.txt"
            rightSlot={
              <button
                onClick={() => setShowRobots(!showRobots)}
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
                {showRobots ? 'Masquer' : 'Afficher'}
              </button>
            }
          />
          {showRobots && (
            <pre
              className="mono"
              style={{
                margin: 0,
                padding: 16,
                fontSize: 12,
                lineHeight: 1.5,
                color: 'var(--sa-ink-2)',
                background: 'var(--sa-cream-2)',
                border: '1px solid var(--sa-rule)',
                whiteSpace: 'pre-wrap',
                maxHeight: 256,
                overflowY: 'auto',
              }}
            >
              {data.robotsTxt.content}
            </pre>
          )}
        </section>
      )}

      {/* §10 — Resource Hints */}
      <section>
        <SectionHeader
          num="10"
          title="Resource Hints"
          info={
            <InfoBox
              items={[
                { term: 'Resource Hints', definition: "Indications dans le <head> qui aident le navigateur à charger plus vite les ressources critiques. Bien dosés, ils accélèrent significativement le rendu." },
                { term: 'Preconnect', definition: "Établit la connexion TCP/TLS à un domaine tiers avant qu'il soit requis (ex: fonts.googleapis.com, GA). Économise 100-300 ms par origine." },
                { term: 'Preload', definition: "Force le téléchargement immédiat d'une ressource critique (font, hero image, CSS bloquant). À utiliser avec parcimonie — abuser dégrade la performance." },
                { term: 'Prefetch', definition: 'Télécharge en basse priorité une ressource probablement nécessaire pour la page suivante. Idéal pour pré-charger la prochaine étape d\'un funnel.' },
                { term: 'DNS-Prefetch', definition: "Résout le DNS d'un domaine tiers en avance — moins coûteux que preconnect, utile quand vous savez que vous appellerez le domaine sans connaître quand exactement." },
              ]}
            />
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {[
            { label: 'Preconnect',   value: data.resourceHints.preconnect },
            { label: 'Preload',      value: data.resourceHints.preload },
            { label: 'Prefetch',     value: data.resourceHints.prefetch },
            { label: 'DNS-Prefetch', value: data.resourceHints.dnsPrefetch },
          ].map((hint) => (
            <CheckPill
              key={hint.label}
              label={hint.label}
              ok={hint.value > 0}
              tone="warn"
              status={String(hint.value)}
            />
          ))}
        </div>
      </section>

      {/* §11 — HTTP Headers */}
      <section>
        <SectionHeader
          num="11"
          title="Headers HTTP"
          info={
            <InfoBox
              items={[
                { term: 'Headers HTTP', definition: "Métadonnées renvoyées par votre serveur avec chaque page. Contrôlent l'indexation, la sécurité, le cache et bien d'autres comportements navigateur." },
                { term: 'X-Robots-Tag', definition: "Équivalent header de la balise meta robots — peut bloquer l'indexation côté serveur. Utile pour les fichiers non-HTML (PDF, images). NOINDEX = page invisible sur Google." },
                { term: 'Cache-Control', definition: "Indique au navigateur et aux CDN combien de temps garder la page en cache. Sans header, chaque visite redemande tout — performance dégradée." },
                { term: 'Content-Security-Policy (CSP)', definition: "Liste blanche de sources autorisées pour scripts/styles/images. Empêche les attaques XSS. Recommandé sur tout site moderne." },
                { term: 'Strict-Transport-Security (HSTS)', definition: "Force le navigateur à utiliser HTTPS pendant N jours. Empêche les attaques de downgrade SSL. Obligatoire pour les sites bancaires/sensibles." },
              ]}
            />
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {(() => {
            const xrt = data.httpHeaders.xRobotsTag;
            const isNoindex = xrt?.toLowerCase().includes('noindex');
            return (
              <CheckPill
                label="X-Robots-Tag"
                ok={!!xrt && !isNoindex}
                tone={isNoindex ? 'error' : 'warn'}
                value={xrt}
                status={isNoindex ? 'NOINDEX' : xrt ? '✓ OK' : 'N/A'}
              />
            );
          })()}
          <CheckPill label="Cache-Control" ok={!!data.httpHeaders.cacheControl} tone="warn" />
          <CheckPill label="CSP" ok={data.httpHeaders.contentSecurityPolicy} tone="warn" />
          <CheckPill label="HSTS" ok={data.httpHeaders.strictTransportSecurity} tone="warn" />
        </div>
      </section>

      {/* §12 — PWA / Manifest */}
      <section>
        <SectionHeader
          num="12"
          title="PWA / Manifest"
          info={
            <InfoBox
              items={[
                { term: 'PWA (Progressive Web App)', definition: "Site web installable comme une app native (iOS/Android/desktop). Fonctionne hors ligne, peut envoyer des notifications. Améliore l'engagement utilisateur sans publier sur les stores." },
                { term: 'manifest.json', definition: "Fichier JSON qui décrit votre app à l'OS : nom, icônes, couleur de thème, mode d'affichage. Sa présence active la prompt « Ajouter à l'écran d'accueil » sur Chrome/Safari mobile." },
                { term: 'Pourquoi ça compte', definition: "Pour les sites e-commerce/SaaS/médias, l'installation PWA augmente significativement le retention rate. Pour un site vitrine, c'est un nice-to-have — pas critique mais professionnel." },
              ]}
            />
          }
        />
        <div style={{ maxWidth: 380 }}>
          <CheckPill
            label="manifest.json"
            ok={data.manifest.exists}
            tone="warn"
            value={data.manifest.href ?? null}
          />
        </div>
      </section>

      {/* §13 — Accessibilité */}
      <section>
        <SectionHeader
          num="13"
          title="Accessibilité"
          info={
            <InfoBox
              items={[
                { term: 'Skip Navigation', definition: 'Lien invisible (visible au focus clavier) qui permet aux utilisateurs de clavier et lecteurs d\'écran de sauter la navigation.' },
                { term: 'Attribut lang', definition: "L'attribut lang sur le <html> aide les lecteurs d'écran et améliore l'indexation multilingue." },
                { term: 'Labels de formulaire', definition: 'Chaque champ doit avoir un label associé. Essentiel pour les lecteurs d\'écran.' },
              ]}
            />
          }
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <CheckPill label="Skip nav" ok={data.accessibility.hasSkipNav} tone="warn" />
          <CheckPill label="Attr. lang" ok={data.accessibility.hasLangAttribute} />
          <CheckPill
            label="Labels formulaire"
            ok={data.accessibility.missingFormLabels === 0}
            tone="warn"
            status={data.accessibility.missingFormLabels === 0 ? '✓ OK' : `${data.accessibility.missingFormLabels} manq.`}
          />
          <CheckPill
            label="ARIA boutons"
            ok={data.accessibility.missingButtonLabels === 0}
            tone="warn"
            status={data.accessibility.missingButtonLabels === 0 ? '✓ OK' : `${data.accessibility.missingButtonLabels} manq.`}
          />
        </div>
      </section>

      <CTABanner variant="inline" />
    </TabFrame>
  );
}
