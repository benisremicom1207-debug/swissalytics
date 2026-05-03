/**
 * Analyseur Lighthouse
 * 
 * Intègre Google Lighthouse pour auditer:
 * - Performance
 * - Accessibilité
 * - Best Practices
 * - SEO technique
 */

export interface LighthouseResult {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  metrics: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    cls: number; // Cumulative Layout Shift
    tti: number; // Time to Interactive
  };
  // Indicate if this is estimated data (fallback mode)
  isEstimated?: boolean;
  warning?: string;
}

export async function runLighthouseAudit(url: string): Promise<LighthouseResult> {
  console.log(`[Lighthouse] Démarrage audit de ${url}...`);

  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

  // If API key is available, use official PageSpeed Insights
  if (apiKey) {
    try {
      const result = await fetchPageSpeedInsights(url, apiKey);

      return {
        performance: result.performance * 100,
        accessibility: result.accessibility * 100,
        bestPractices: result.bestPractices * 100,
        seo: result.seo * 100,
        metrics: {
          fcp: result.metrics.fcp,
          lcp: result.metrics.lcp,
          cls: result.metrics.cls,
          tti: result.metrics.tti,
        },
      };
    } catch (error) {
      console.error('[Lighthouse] PageSpeed API error, falling back to estimation:', error);
      // Fall through to estimation mode
    }
  }

  // Fallback: Estimate performance by fetching the page
  console.log('[Lighthouse] Mode estimation (pas de clé API ou erreur)');
  return estimatePerformance(url);
}

/**
 * Estimation de performance sans API Lighthouse
 * Mesure le temps de chargement et analyse le HTML
 */
async function estimatePerformance(url: string): Promise<LighthouseResult> {
  const startTime = Date.now();

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Swissalytics/1.0 +https://swissalytics.com)',
      },
    });

    const loadTime = Date.now() - startTime;
    const html = await response.text();

    // Estimate performance based on load time
    let performanceScore = 90;
    if (loadTime > 1000) performanceScore = 80;
    if (loadTime > 2000) performanceScore = 65;
    if (loadTime > 3000) performanceScore = 50;
    if (loadTime > 5000) performanceScore = 35;

    // Estimate SEO based on HTML content
    const seoScore = estimateSEOFromHTML(html);

    // Basic accessibility estimation from HTML
    const accessibilityScore = estimateAccessibilityFromHTML(html);

    // Best practices estimation
    const bestPracticesScore = estimateBestPracticesFromHTML(html, url);

    return {
      performance: performanceScore,
      accessibility: accessibilityScore,
      bestPractices: bestPracticesScore,
      seo: seoScore,
      metrics: {
        fcp: loadTime * 0.3, // Estimate FCP as 30% of total load
        lcp: loadTime * 0.7, // Estimate LCP as 70% of total load
        cls: 0.1, // Cannot measure without browser, assume average
        tti: loadTime * 1.2, // Estimate TTI slightly higher than load
      },
      isEstimated: true,
      warning: 'Scores estimés (sans API Google PageSpeed). Pour des résultats précis, configurez GOOGLE_PAGESPEED_API_KEY.',
    };
  } catch (error) {
    console.error('[Lighthouse] Estimation error:', error);

    // Return minimum viable scores if even basic fetch fails
    return {
      performance: 50,
      accessibility: 50,
      bestPractices: 50,
      seo: 50,
      metrics: {
        fcp: 2000,
        lcp: 4000,
        cls: 0.15,
        tti: 5000,
      },
      isEstimated: true,
      warning: 'Impossible d\'analyser la page. Vérifiez que l\'URL est accessible.',
    };
  }
}

/**
 * Estimate SEO score from HTML content
 */
function estimateSEOFromHTML(html: string): number {
  let score = 100;

  // Check for meta title
  if (!/<title[^>]*>.+<\/title>/i.test(html)) score -= 15;

  // Check for meta description
  if (!/<meta[^>]*name=["']description["'][^>]*>/i.test(html)) score -= 15;

  // Check for h1
  if (!/<h1[^>]*>/i.test(html)) score -= 10;

  // Check for viewport meta
  if (!/<meta[^>]*name=["']viewport["'][^>]*>/i.test(html)) score -= 10;

  // Check for canonical
  if (!/<link[^>]*rel=["']canonical["'][^>]*>/i.test(html)) score -= 5;

  // Check for lang attribute
  if (!/<html[^>]*lang=/i.test(html)) score -= 5;

  // Check for image alt tags (penalty if many images without alt)
  const imgCount = (html.match(/<img[^>]*>/gi) || []).length;
  const imgAltCount = (html.match(/<img[^>]*alt=["'][^"']+["'][^>]*>/gi) || []).length;
  if (imgCount > 0 && imgAltCount / imgCount < 0.5) score -= 10;

  return Math.max(score, 30);
}

/**
 * Estimate accessibility score from HTML content
 */
function estimateAccessibilityFromHTML(html: string): number {
  let score = 85; // Start with base score

  // Check for lang attribute
  if (/<html[^>]*lang=/i.test(html)) score += 5;

  // Check for alt attributes on images
  const imgCount = (html.match(/<img[^>]*>/gi) || []).length;
  const imgAltCount = (html.match(/<img[^>]*alt=/gi) || []).length;
  if (imgCount > 0 && imgAltCount / imgCount >= 0.8) score += 5;

  // Check for form labels
  const inputCount = (html.match(/<input[^>]*>/gi) || []).length;
  const labelCount = (html.match(/<label[^>]*>/gi) || []).length;
  if (inputCount > 0 && labelCount >= inputCount * 0.7) score += 5;

  // Penalty for inline styles (accessibility concern)
  const inlineStyleCount = (html.match(/style=["']/gi) || []).length;
  if (inlineStyleCount > 20) score -= 5;

  return Math.min(Math.max(score, 40), 95);
}

/**
 * Estimate best practices score
 */
function estimateBestPracticesFromHTML(html: string, url: string): number {
  let score = 80;

  // Check for HTTPS
  if (url.startsWith('https://')) score += 10;

  // Check for doctype
  if (/<!doctype html>/i.test(html)) score += 5;

  // Check for charset
  if (/<meta[^>]*charset=/i.test(html)) score += 5;

  // Penalty for document.write
  if (/document\.write/i.test(html)) score -= 10;

  return Math.min(Math.max(score, 40), 95);
}

/**
 * Appel PageSpeed Insights API
 * https://developers.google.com/speed/docs/insights/v5/get-started
 */
async function fetchPageSpeedInsights(url: string, apiKey: string) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=performance&category=accessibility&category=best-practices&category=seo&strategy=mobile`;

  const response = await fetch(apiUrl);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`PageSpeed API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Validate response structure
  if (!data.lighthouseResult?.categories) {
    throw new Error('Invalid PageSpeed API response structure');
  }

  return {
    performance: data.lighthouseResult.categories.performance?.score ?? 0,
    accessibility: data.lighthouseResult.categories.accessibility?.score ?? 0,
    bestPractices: data.lighthouseResult.categories['best-practices']?.score ?? 0,
    seo: data.lighthouseResult.categories.seo?.score ?? 0,
    metrics: {
      fcp: data.lighthouseResult.audits?.['first-contentful-paint']?.numericValue ?? 2000,
      lcp: data.lighthouseResult.audits?.['largest-contentful-paint']?.numericValue ?? 4000,
      cls: data.lighthouseResult.audits?.['cumulative-layout-shift']?.numericValue ?? 0.1,
      tti: data.lighthouseResult.audits?.interactive?.numericValue ?? 5000,
    },
  };
}

/**
 * Interpréter les scores Lighthouse
 */
export function interpretLighthouseScore(score: number): {
  label: string;
  color: string;
  emoji: string;
} {
  if (score >= 90) {
    return { label: 'Excellent', color: '#0CCE6B', emoji: '✅' };
  } else if (score >= 50) {
    return { label: 'Moyen', color: '#FFA400', emoji: '⚠️' };
  } else {
    return { label: 'Critique', color: '#FF4E42', emoji: '❌' };
  }
}
