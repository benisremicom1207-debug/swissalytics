import type { CheerioAPI } from './cheerio';
import https from 'https';
import http from 'http';
import type { TechnicalAnalysis, AccessibilityBasics, Issue, CwvMetrics } from '../types';
import { validateUrl } from '@/lib/security';

async function fetchText(url: string, maxRedirects = 5): Promise<{ ok: boolean; text: string }> {
  try {
    await validateUrl(url);
  } catch {
    return { ok: false, text: '' };
  }

  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(url);
      const mod = parsedUrl.protocol === 'https:' ? https : http;

      const req = mod.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: 'GET',
        timeout: 3000,
        rejectUnauthorized: false,
      }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (maxRedirects <= 0) {
            resolve({ ok: false, text: '' });
            return;
          }
          const redirectUrl = new URL(res.headers.location, url).href;
          fetchText(redirectUrl, maxRedirects - 1).then(resolve);
          return;
        }
        if (!res.statusCode || res.statusCode >= 400) {
          resolve({ ok: false, text: '' });
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ ok: true, text: Buffer.concat(chunks).toString('utf-8') }));
        res.on('error', () => resolve({ ok: false, text: '' }));
      });
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, text: '' }); });
      req.on('error', () => resolve({ ok: false, text: '' }));
      req.end();
    } catch {
      resolve({ ok: false, text: '' });
    }
  });
}

export async function fetchCoreWebVitals(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<CwvMetrics | undefined> {
  try {
    const apiKey = process.env.PAGESPEED_API_KEY;
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance${apiKey ? `&key=${apiKey}` : ''}`;
    console.log('[CWV] API key present:', !!apiKey);
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return undefined;
    const data = await res.json();
    const audits = data.lighthouseResult?.audits;
    const perf = data.lighthouseResult?.categories?.performance?.score;
    if (!audits || perf === undefined) return undefined;
    return {
      performance: Math.round(perf * 100),
      fcp: audits['first-contentful-paint']?.numericValue || 0,
      lcp: audits['largest-contentful-paint']?.numericValue || 0,
      cls: audits['cumulative-layout-shift']?.numericValue || 0,
      tbt: audits['total-blocking-time']?.numericValue || 0,
      si: audits['speed-index']?.numericValue || 0,
    };
  } catch {
    return undefined;
  }
}

function detectCMS($: CheerioAPI, html: string): string | null {
  // Major CMS
  if (html.includes('wp-content') || html.includes('wp-includes') || $('meta[name="generator"][content*="WordPress"]').length) return 'WordPress';
  if (html.includes('/media/jui/') || html.includes('Joomla') || $('meta[name="generator"][content*="Joomla"]').length) return 'Joomla';
  if (html.includes('Drupal') || $('meta[name="generator"][content*="Drupal"]').length) return 'Drupal';
  if (html.includes('cdn.shopify.com') || html.includes('Shopify.theme')) return 'Shopify';
  if (html.includes('wix.com') || html.includes('X-Wix')) return 'Wix';
  if (html.includes('squarespace.com') || html.includes('Squarespace')) return 'Squarespace';
  if (html.includes('webflow.com') || html.includes('w-layout-grid')) return 'Webflow';
  if (html.includes('prestashop') || $('meta[name="generator"][content*="PrestaShop"]').length) return 'PrestaShop';
  if (html.includes('typo3') || $('meta[name="generator"][content*="TYPO3"]').length) return 'TYPO3';
  if (html.includes('mage-') || html.includes('Magento') || html.includes('magento')) return 'Magento';

  // Headless CMS / SaaS
  if (html.includes('contentful.com') || html.includes('ctfassets.net')) return 'Contentful';
  if (html.includes('prismic.io') || html.includes('prismic-dom')) return 'Prismic';
  if (html.includes('storyblok') || html.includes('storyblok.com')) return 'Storyblok';
  if (html.includes('sanity.io') || html.includes('cdn.sanity.io')) return 'Sanity';
  if (html.includes('strapi') || html.includes('/uploads/') && html.includes('api::')) return 'Strapi';
  if (html.includes('ghost.io') || html.includes('ghost-') || $('meta[name="generator"][content*="Ghost"]').length) return 'Ghost';
  if (html.includes('hubspot') || html.includes('hs-scripts.com') || html.includes('hubspot.net')) return 'HubSpot';
  if (html.includes('craft-') || $('meta[name="generator"][content*="Craft"]').length) return 'Craft CMS';
  if (html.includes('sitecore') || html.includes('Sitecore')) return 'Sitecore';
  if (html.includes('kentico') || html.includes('Kentico')) return 'Kentico';
  if (html.includes('umbraco') || $('meta[name="generator"][content*="Umbraco"]').length) return 'Umbraco';

  // E-commerce
  if (html.includes('woocommerce') || html.includes('wc-') && html.includes('wp-content')) return 'WooCommerce';
  if (html.includes('bigcommerce') || html.includes('BigCommerce')) return 'BigCommerce';

  // Website builders
  if (html.includes('jimdo') || html.includes('Jimdo')) return 'Jimdo';
  if (html.includes('weebly') || html.includes('Weebly')) return 'Weebly';
  if (html.includes('duda.co') || html.includes('__duda')) return 'Duda';
  if (html.includes('strikingly.com')) return 'Strikingly';
  if (html.includes('cargo.site') || html.includes('Cargo')) return 'Cargo';
  if (html.includes('framer.com') || html.includes('framer-')) return 'Framer';

  // Swiss / Real estate specific
  if (html.includes('immomig') || html.includes('Immomig')) return 'Immomig';
  if (html.includes('casasoft') || html.includes('CasaSoft') || html.includes('casagateway')) return 'Casasoft';
  if (html.includes('apimo') || html.includes('Apimo')) return 'Apimo';
  if (html.includes('sweepbright') || html.includes('SweepBright')) return 'SweepBright';

  // Frameworks (lower priority — check after CMS)
  if (html.includes('__next') || html.includes('_next/static')) return 'Next.js';
  if (html.includes('__nuxt') || html.includes('_nuxt/')) return 'Nuxt.js';
  if (html.includes('gatsby') || html.includes('___gatsby')) return 'Gatsby';
  if (html.includes('__sveltekit') || html.includes('_app/immutable')) return 'SvelteKit';
  if (html.includes('astro-') || html.includes('/_astro/')) return 'Astro';
  if (html.includes('remix-') || $('meta[name="generator"][content*="Remix"]').length) return 'Remix';

  const generator = $('meta[name="generator"]').attr('content');
  if (generator) return generator.split(' ')[0];

  // Fallback: check powered-by headers leaked in HTML comments or meta
  const poweredBy = $('meta[name="powered-by"], meta[http-equiv="X-Powered-By"]').attr('content');
  if (poweredBy) return poweredBy;

  return null;
}

function detectTechnologies($: CheerioAPI, html: string): string[] {
  const techs: string[] = [];

  if (html.includes('google-analytics.com') || html.includes('gtag(') || html.includes('GoogleAnalyticsObject')) techs.push('Google Analytics');
  if (html.includes('googletagmanager.com') || html.includes('GTM-')) techs.push('GTM');
  if (html.includes('facebook.com/tr') || html.includes('fbq(') || html.includes('Meta Pixel')) techs.push('Meta Pixel');
  if (html.includes('linkedin.com/insight') || html.includes('_linkedin_partner_id')) techs.push('LinkedIn Insight');
  if (html.includes('hotjar.com') || html.includes('hj(')) techs.push('Hotjar');
  if (html.includes('plausible.io')) techs.push('Plausible');
  if (html.includes('matomo') || html.includes('piwik')) techs.push('Matomo');

  if (html.includes('jquery') || $('script[src*="jquery"]').length) techs.push('jQuery');
  if (html.includes('bootstrap') || $('link[href*="bootstrap"]').length) techs.push('Bootstrap');
  if (html.includes('tailwindcss') || html.includes('tailwind')) techs.push('Tailwind CSS');
  if (html.includes('react') && (html.includes('__react') || html.includes('reactDOM'))) techs.push('React');
  if (html.includes('vue') && (html.includes('__vue') || html.includes('Vue.'))) techs.push('Vue.js');
  if (html.includes('angular') || html.includes('ng-')) techs.push('Angular');

  if (html.includes('recaptcha') || html.includes('grecaptcha')) techs.push('reCAPTCHA');
  if (html.includes('cloudflare')) techs.push('Cloudflare');
  if (html.includes('cookiebot') || html.includes('CookieConsent') || html.includes('tarteaucitron') || html.includes('axeptio') || html.includes('onetrust') || html.includes('OneTrust')) techs.push('Cookie Consent');
  if (html.includes('schema.org') || html.includes('application/ld+json')) techs.push('Schema.org');
  if (html.includes('swiper') || html.includes('Swiper')) techs.push('Swiper');
  if (html.includes('gsap') || html.includes('ScrollTrigger')) techs.push('GSAP');
  if (html.includes('fonts.googleapis.com') || html.includes('fonts.gstatic.com')) techs.push('Google Fonts');
  if (html.includes('hubspot') || html.includes('hs-scripts.com') || html.includes('hbspt.')) techs.push('HubSpot');
  if (html.includes('salesforce') || html.includes('pardot') || html.includes('force.com')) techs.push('Salesforce');
  if (html.includes('maps.googleapis.com') || html.includes('maps.google.com')) techs.push('Google Maps');
  if (html.includes('youtube.com/embed') || html.includes('youtube-nocookie.com')) techs.push('YouTube');
  if (html.includes('vimeo.com')) techs.push('Vimeo');
  if (html.includes('typekit.net') || html.includes('use.typekit.net')) techs.push('Adobe Fonts');
  if (html.includes('clarity.ms') || html.includes('clarity(')) techs.push('Microsoft Clarity');
  if (html.includes('intercom') || html.includes('Intercom')) techs.push('Intercom');
  if (html.includes('crisp.chat') || html.includes('$crisp')) techs.push('Crisp');
  if (html.includes('zendesk') || html.includes('Zendesk')) techs.push('Zendesk');
  if (html.includes('drift.com') || html.includes('Drift')) techs.push('Drift');
  if (html.includes('mailchimp') || html.includes('mc.js')) techs.push('Mailchimp');
  if (html.includes('lazysizes') || html.includes('lazyload')) techs.push('Lazy Loading Lib');
  if (html.includes('polyfill.io')) techs.push('Polyfill.io');
  if (html.includes('unpkg.com') || html.includes('cdnjs.cloudflare.com') || html.includes('jsdelivr.net')) techs.push('CDN Libraries');

  return [...new Set(techs)];
}

function analyzeCss($: CheerioAPI, baseUrl: string) {
  let inline = 0;
  let local = 0;
  let external = 0;

  $('style').each(() => { inline++; });

  $('link[rel="stylesheet"]').each((_: number, el: any) => {
    const href = $(el).attr('href') || '';
    if (!href) return;
    try {
      const url = new URL(href, baseUrl);
      if (url.hostname === new URL(baseUrl).hostname) local++;
      else external++;
    } catch {
      local++;
    }
  });

  let inlineStyles = 0;
  $('[style]').slice(0, 200).each(() => { inlineStyles++; });

  return { total: inline + local + external, inline: inlineStyles, local, external };
}

function analyzeJs($: CheerioAPI, baseUrl: string) {
  let inline = 0;
  let local = 0;
  let external = 0;
  let blocking = 0;

  $('script').each((_: number, el: any) => {
    const $el = $(el);
    const src = $el.attr('src');
    const isAsync = $el.attr('async') !== undefined;
    const isDefer = $el.attr('defer') !== undefined;
    const isModule = $el.attr('type') === 'module';

    if (!src) {
      if (($el.html() || '').trim().length > 0) inline++;
      return;
    }

    try {
      const url = new URL(src, baseUrl);
      if (url.hostname === new URL(baseUrl).hostname) local++;
      else external++;
    } catch {
      local++;
    }

    if (!isAsync && !isDefer && !isModule) blocking++;
  });

  return { total: inline + local + external, inline, local, external, blocking };
}

export async function analyzeTechnical($: CheerioAPI, pageUrl: string, html?: string, responseHeaders?: Record<string, string>, primaryKeyword?: string): Promise<TechnicalAnalysis> {
  const issues: Issue[] = [];
  let baseUrl: string;
  try {
    const u = new URL(pageUrl);
    baseUrl = `${u.protocol}//${u.hostname}`;
  } catch {
    baseUrl = pageUrl;
  }

  const fullHtml = html || $.html() || '';
  const htmlSize = Buffer.byteLength(fullHtml, 'utf-8');

  const [robotsRes, llmsRes, sitemapRes] = await Promise.all([
    fetchText(`${baseUrl}/robots.txt`),
    fetchText(`${baseUrl}/llms.txt`),
    fetchText(`${baseUrl}/sitemap.xml`),
  ]);

  const robotsTxt = { exists: robotsRes.ok, content: robotsRes.ok ? robotsRes.text.substring(0, 2000) : undefined };
  const llmsTxt = { exists: llmsRes.ok, content: llmsRes.ok ? llmsRes.text.substring(0, 2000) : undefined };

  let sitemapExists = sitemapRes.ok;
  let sitemapUrl = sitemapExists ? `${baseUrl}/sitemap.xml` : undefined;
  let sitemapInRobots = false;
  if (robotsRes.ok) {
    const match = robotsRes.text.match(/Sitemap:\s*(.+)/i);
    if (match) {
      sitemapInRobots = true;
      if (!sitemapExists) {
        sitemapUrl = match[1].trim();
        sitemapExists = true;
      }
    }
  }

  const canonical = $('link[rel="canonical"]').attr('href') || null;
  const lang = $('html').attr('lang') || null;
  const viewport = $('meta[name="viewport"]').attr('content') || null;
  const charset = $('meta[charset]').attr('charset') || ($('meta[http-equiv="Content-Type"]').attr('content')?.match(/charset=([^\s;]+)/)?.[1]) || null;

  const cms = detectCMS($, fullHtml);
  const technologies = detectTechnologies($, fullHtml);

  const cssAnalysis = analyzeCss($, baseUrl);
  const jsAnalysis = analyzeJs($, baseUrl);

  // Check semantic HTML
  const hasNav = $('nav').length > 0;
  const hasMain = $('main').length > 0;
  const hasHeader = $('header').length > 0;
  const hasFooter = $('footer').length > 0;

  // HTTPS & mixed content
  const isHttps = pageUrl.startsWith('https://');
  let mixedContentCount = 0;
  if (isHttps) {
    $('img[src^="http://"], script[src^="http://"], link[href^="http://"], iframe[src^="http://"], video[src^="http://"], audio[src^="http://"]').each(() => {
      mixedContentCount++;
    });
  }

  // Accessibility basics
  let missingFormLabels = 0;
  $('input').each((_: number, el: any) => {
    const $el = $(el);
    const inputType = ($el.attr('type') || '').toLowerCase();
    if (inputType === 'hidden' || inputType === 'submit' || inputType === 'button') return;
    const hasAriaLabel = !!$el.attr('aria-label') || !!$el.attr('aria-labelledby');
    const id = $el.attr('id');
    const hasLabelFor = id ? $(`label[for="${id}"]`).length > 0 : false;
    const hasParentLabel = $el.closest('label').length > 0;
    if (!hasAriaLabel && !hasLabelFor && !hasParentLabel) missingFormLabels++;
  });

  let missingButtonLabels = 0;
  $('button').each((_: number, el: any) => {
    const $el = $(el);
    const text = $el.text().trim();
    const hasAriaLabel = !!$el.attr('aria-label') || !!$el.attr('aria-labelledby');
    const hasTitle = !!$el.attr('title');
    if (!text && !hasAriaLabel && !hasTitle) missingButtonLabels++;
  });

  const hasSkipNav = $('a[href="#main"], a[href="#content"], a[href="#main-content"], a.skip-link, a.skip-nav, [class*="skip-link"], [class*="skip-nav"]').length > 0;
  const hasLangAttribute = !!$('html').attr('lang');

  const accessibility: AccessibilityBasics = {
    missingFormLabels,
    missingButtonLabels,
    hasSkipNav,
    hasLangAttribute,
  };

  // Issues
  if (!robotsTxt.exists) issues.push({ type: 'warning', message: 'Fichier robots.txt introuvable' });
  if (robotsTxt.exists && !sitemapInRobots) issues.push({ type: 'info', message: 'Sitemap non référencé dans robots.txt' });
  if (!sitemapExists) issues.push({ type: 'warning', message: 'Fichier sitemap.xml introuvable' });
  if (!llmsTxt.exists) issues.push({ type: 'info', message: 'Fichier llms.txt introuvable (recommandé pour le GEO)' });
  if (!canonical) issues.push({ type: 'warning', message: 'Balise canonical manquante' });
  if (!lang) issues.push({ type: 'warning', message: 'Attribut lang manquant sur la balise <html>' });
  if (!viewport) issues.push({ type: 'error', message: 'Meta viewport manquante' });
  if (!charset) issues.push({ type: 'warning', message: 'Charset non spécifié' });

  if (htmlSize > 2 * 1024 * 1024) {
    issues.push({ type: 'error', message: `Taille HTML excessive: ${(htmlSize / 1024).toFixed(0)} KB (limite Google: 2 MB)` });
  } else if (htmlSize > 1 * 1024 * 1024) {
    issues.push({ type: 'warning', message: `Taille HTML élevée: ${(htmlSize / 1024).toFixed(0)} KB (limite Google: 2 MB)` });
  }

  if (jsAnalysis.blocking > 5) {
    issues.push({ type: 'warning', message: `${jsAnalysis.blocking} scripts bloquants détectés (utilisez async/defer)` });
  } else if (jsAnalysis.blocking > 0) {
    issues.push({ type: 'info', message: `${jsAnalysis.blocking} script(s) bloquant(s) détecté(s)` });
  }

  if (cssAnalysis.inline > 30) {
    issues.push({ type: 'warning', message: `${cssAnalysis.inline} styles inline détectés — externalisez le CSS` });
  }

  if (!isHttps) {
    issues.push({ type: 'error', message: 'Le site n\'utilise pas HTTPS — indispensable pour la sécurité et le SEO' });
  }
  if (mixedContentCount > 0) {
    issues.push({ type: 'warning', message: `${mixedContentCount} ressource(s) en HTTP sur une page HTTPS (contenu mixte)` });
  }

  if (!hasMain) {
    issues.push({ type: 'info', message: 'Balise <main> absente — recommandée pour le HTML sémantique' });
  }
  if (!hasNav) {
    issues.push({ type: 'info', message: 'Balise <nav> absente — recommandée pour la navigation sémantique' });
  }

  if (missingFormLabels > 0) {
    issues.push({ type: 'warning', message: `${missingFormLabels} champ(s) de formulaire sans label associé ni aria-label` });
  }
  if (missingButtonLabels > 0) {
    issues.push({ type: 'warning', message: `${missingButtonLabels} bouton(s) sans texte ni aria-label` });
  }
  if (!hasSkipNav) {
    issues.push({ type: 'info', message: 'Lien « skip navigation » absent — recommandé pour l\'accessibilité' });
  }

  // URL Structure
  let urlStructure = { length: 0, hasUnderscores: false, hasUppercase: false, hasSpecialChars: false, depth: 0, keywordInUrl: false };
  try {
    const parsedPageUrl = new URL(pageUrl);
    const pathname = parsedPageUrl.pathname;
    urlStructure = {
      length: pathname.length,
      hasUnderscores: /_/.test(pathname),
      hasUppercase: /[A-Z]/.test(pathname),
      hasSpecialChars: /[^a-zA-Z0-9/_\-.]/.test(pathname),
      depth: pathname.split('/').filter(s => s.length > 0).length,
      keywordInUrl: primaryKeyword ? pathname.toLowerCase().includes(primaryKeyword.toLowerCase()) : false,
    };
    if (urlStructure.length > 100) issues.push({ type: 'warning', message: `URL trop longue (${urlStructure.length} car.) — recommandé < 100 caractères` });
    if (urlStructure.hasUnderscores) issues.push({ type: 'warning', message: 'URL contient des underscores — utilisez des tirets (-) à la place' });
    if (urlStructure.hasUppercase) issues.push({ type: 'info', message: 'URL contient des majuscules — préférez les minuscules' });
    if (urlStructure.depth > 4) issues.push({ type: 'info', message: `URL profonde (${urlStructure.depth} niveaux) — préférez une structure plus plate` });
  } catch { /* keep defaults */ }

  // Resource Hints
  const resourceHints = {
    preconnect: $('link[rel="preconnect"]').length,
    preload: $('link[rel="preload"]').length,
    prefetch: $('link[rel="prefetch"]').length,
    dnsPrefetch: $('link[rel="dns-prefetch"]').length,
  };
  if (resourceHints.preconnect === 0 && resourceHints.preload === 0) {
    issues.push({ type: 'info', message: 'Aucun resource hint (preconnect/preload) — recommandé pour accélérer le chargement' });
  }

  // HTTP Headers
  const headers = responseHeaders || {};
  const httpHeaders = {
    xRobotsTag: headers['x-robots-tag'] || null,
    cacheControl: headers['cache-control'] || null,
    contentSecurityPolicy: !!headers['content-security-policy'],
    strictTransportSecurity: !!headers['strict-transport-security'],
  };
  if (httpHeaders.xRobotsTag && httpHeaders.xRobotsTag.toLowerCase().includes('noindex')) {
    issues.push({ type: 'warning', message: 'Header X-Robots-Tag contient noindex — la page ne sera pas indexée' });
  }
  if (!httpHeaders.cacheControl) {
    issues.push({ type: 'info', message: 'Header Cache-Control absent — recommandé pour optimiser la mise en cache' });
  }
  if (isHttps && !httpHeaders.strictTransportSecurity) {
    issues.push({ type: 'info', message: 'Header HSTS (Strict-Transport-Security) absent — recommandé pour la sécurité HTTPS' });
  }

  // PWA / Manifest
  const manifestLink = $('link[rel="manifest"]');
  const manifest = {
    exists: manifestLink.length > 0,
    href: manifestLink.attr('href') || undefined,
  };
  if (!manifest.exists) {
    issues.push({ type: 'info', message: 'Fichier manifest.json absent — nécessaire pour la PWA' });
  }

  // Scoring — strict
  let score = 100;

  // Fundamentals (max -35)
  if (!robotsTxt.exists) score -= 8;
  if (!sitemapExists) score -= 8;
  if (!canonical) score -= 8;
  if (!lang) score -= 5;
  if (!viewport) score -= 12;
  if (!charset) score -= 4;

  // HTTPS (max -15)
  if (!isHttps) score -= 15;
  if (mixedContentCount > 0) score -= Math.min(8, mixedContentCount * 2);

  // Accessibility (max -8)
  if (missingFormLabels > 0) score -= Math.min(4, missingFormLabels);
  if (missingButtonLabels > 0) score -= Math.min(4, missingButtonLabels);

  // Modern SEO (max -15)
  if (!llmsTxt.exists) score -= 3;
  if (robotsTxt.exists && !sitemapInRobots) score -= 3;
  if (cssAnalysis.inline > 30) score -= 5;
  if (!hasMain && !hasNav) score -= 4;

  // HTML size
  if (htmlSize > 2 * 1024 * 1024) score -= 15;
  else if (htmlSize > 1 * 1024 * 1024) score -= 8;

  // Scripts
  if (jsAnalysis.blocking > 5) score -= 8;
  else if (jsAnalysis.blocking > 0) score -= 3;

  // URL Structure
  if (urlStructure.length > 100) score -= 3;
  if (urlStructure.hasUnderscores) score -= 2;
  if (urlStructure.hasUppercase) score -= 1;

  // Resource Hints
  if (resourceHints.preconnect === 0 && resourceHints.preload === 0) score -= 2;

  // HTTP Headers
  if (httpHeaders.xRobotsTag && httpHeaders.xRobotsTag.toLowerCase().includes('noindex')) score -= 5;
  if (!httpHeaders.cacheControl) score -= 2;

  // Manifest
  if (!manifest.exists) score -= 1;

  return {
    score: Math.max(0, Math.min(100, score)),
    robotsTxt,
    sitemap: { exists: sitemapExists, url: sitemapUrl, inRobots: sitemapInRobots },
    llmsTxt,
    canonical,
    lang,
    viewport,
    charset,
    cms,
    technologies,
    htmlSize,
    isHttps,
    mixedContentCount,
    accessibility,
    cssAnalysis,
    jsAnalysis,
    coreWebVitals: undefined,
    urlStructure,
    resourceHints,
    httpHeaders,
    manifest,
    issues,
  };
}

export function applyCwvToTechnical(
  cwv: CwvMetrics
): { cwvIssues: Issue[]; cwvScorePenalty: number } {
  const cwvIssues: Issue[] = [];
  let cwvScorePenalty = 0;

  // Issues
  if (cwv.performance < 50) cwvIssues.push({ type: 'error', message: `Score performance mobile faible: ${cwv.performance}/100` });
  else if (cwv.performance < 80) cwvIssues.push({ type: 'warning', message: `Score performance mobile moyen: ${cwv.performance}/100` });
  if (cwv.lcp > 4000) cwvIssues.push({ type: 'error', message: `LCP trop lent: ${(cwv.lcp / 1000).toFixed(1)}s (max 2.5s)` });
  else if (cwv.lcp > 2500) cwvIssues.push({ type: 'warning', message: `LCP à améliorer: ${(cwv.lcp / 1000).toFixed(1)}s (recommandé < 2.5s)` });
  if (cwv.cls > 0.25) cwvIssues.push({ type: 'error', message: `CLS trop élevé: ${cwv.cls.toFixed(3)} (max 0.1)` });
  else if (cwv.cls > 0.1) cwvIssues.push({ type: 'warning', message: `CLS à améliorer: ${cwv.cls.toFixed(3)} (recommandé < 0.1)` });
  if (cwv.fcp > 3000) cwvIssues.push({ type: 'warning', message: `FCP lent: ${(cwv.fcp / 1000).toFixed(1)}s (max 1.8s)` });
  if (cwv.tbt > 600) cwvIssues.push({ type: 'error', message: `TBT trop élevé: ${Math.round(cwv.tbt)}ms (max 200ms)` });
  else if (cwv.tbt > 200) cwvIssues.push({ type: 'warning', message: `TBT à améliorer: ${Math.round(cwv.tbt)}ms (recommandé < 200ms)` });
  if (cwv.si > 5800) cwvIssues.push({ type: 'error', message: `Speed Index très lent: ${(cwv.si / 1000).toFixed(1)}s (max 3.4s)` });
  else if (cwv.si > 3400) cwvIssues.push({ type: 'warning', message: `Speed Index lent: ${(cwv.si / 1000).toFixed(1)}s (recommandé < 3.4s)` });

  // Score penalty
  if (cwv.performance < 50) cwvScorePenalty += 15;
  else if (cwv.performance < 80) cwvScorePenalty += 8;

  if (cwv.lcp > 4000) cwvScorePenalty += 5;
  else if (cwv.lcp > 2500) cwvScorePenalty += 3;

  if (cwv.cls > 0.25) cwvScorePenalty += 5;
  else if (cwv.cls > 0.1) cwvScorePenalty += 2;

  if (cwv.si > 5800) cwvScorePenalty += 5;
  else if (cwv.si > 3400) cwvScorePenalty += 3;

  return { cwvIssues, cwvScorePenalty };
}
