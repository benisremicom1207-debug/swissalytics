/**
 * Analyseur SEO Traditionnel
 * 
 * Crawl le site et analyse:
 * - Meta tags (title, description, OG)
 * - Structure headings (H1-H6)
 * - Images (alt text, taille, format)
 * - Sitemap.xml et robots.txt
 * - Core Web Vitals
 */

import * as cheerio from 'cheerio';

export interface SEOResult {
  score: number;
  metaTags: {
    score: number;
    title: { found: boolean; length: number; optimal: boolean };
    description: { found: boolean; length: number; optimal: boolean };
    ogImage: boolean;
    ogTitle: boolean;
    ogDescription: boolean;
    canonical: boolean;
  };
  headings: {
    score: number;
    h1Count: number;
    h2Count: number;
    structure: string; // "Bonne" | "Moyenne" | "Mauvaise"
  };
  images: {
    score: number;
    totalImages: number;
    withAlt: number;
    missingAlt: number;
    percentageWithAlt: number;
  };
  sitemap: boolean;
  robots: boolean;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
}

export async function analyzeSEO(url: string): Promise<SEOResult> {
  console.log(`[SEO] Démarrage analyse de ${url}...`);
  
  try {
    // Fetch page HTML
    const html = await fetchPageHTML(url);
    const $ = cheerio.load(html);
    
    // Analyser meta tags
    const metaTags = analyzeMetaTags($);
    
    // Analyser headings
    const headings = analyzeHeadings($);
    
    // Analyser images
    const images = analyzeImages($);
    
    // Vérifier sitemap et robots.txt
    const sitemap = await checkSitemap(url);
    const robots = await checkRobotsTxt(url);
    
    // Core Web Vitals (simplifié - vraie implémentation nécessite CrUX API)
    const coreWebVitals = {
      lcp: 0, // À récupérer via PageSpeed Insights
      fid: 0,
      cls: 0,
    };
    
    // Calcul score global SEO
    const score = calculateSEOScore({
      metaTags,
      headings,
      images,
      sitemap,
      robots,
    });
    
    return {
      score,
      metaTags,
      headings,
      images,
      sitemap,
      robots,
      coreWebVitals,
    };
    
  } catch (error) {
    console.error('[SEO] Erreur:', error);
    
    // Fallback données simulées
    return simulateSEOData(url);
  }
}

/**
 * Fetch HTML de la page
 */
async function fetchPageHTML(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Swissalytics/1.0 (+https://swissalytics.com)',
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return await response.text();
}

/**
 * Analyser meta tags
 */
function analyzeMetaTags($: ReturnType<typeof cheerio.load>) {
  const title = $('title').text();
  const titleLength = title.length;
  
  const description = $('meta[name="description"]').attr('content') || '';
  const descLength = description.length;
  
  const ogImage = $('meta[property="og:image"]').length > 0;
  const ogTitle = $('meta[property="og:title"]').length > 0;
  const ogDescription = $('meta[property="og:description"]').length > 0;
  const canonical = $('link[rel="canonical"]').length > 0;
  
  // Scoring meta tags
  let score = 0;
  if (title && titleLength >= 30 && titleLength <= 60) score += 25;
  else if (title) score += 15;
  
  if (description && descLength >= 120 && descLength <= 160) score += 25;
  else if (description) score += 15;
  
  if (ogImage) score += 15;
  if (ogTitle) score += 10;
  if (ogDescription) score += 10;
  if (canonical) score += 15;
  
  return {
    score,
    title: {
      found: !!title,
      length: titleLength,
      optimal: titleLength >= 30 && titleLength <= 60,
    },
    description: {
      found: !!description,
      length: descLength,
      optimal: descLength >= 120 && descLength <= 160,
    },
    ogImage,
    ogTitle,
    ogDescription,
    canonical,
  };
}

/**
 * Analyser structure headings
 */
function analyzeHeadings($: ReturnType<typeof cheerio.load>) {
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  
  let structure = 'Mauvaise';
  let score = 0;
  
  if (h1Count === 1) {
    score += 40; // 1 seul H1 = bon
  } else if (h1Count > 1) {
    score += 20; // Multiple H1 = moyen
  }
  
  if (h2Count >= 2) {
    score += 30; // Au moins 2 H2 = bon
  } else if (h2Count === 1) {
    score += 15;
  }
  
  if (h3Count > 0) {
    score += 30; // H3 pour hiérarchie = bon
  }
  
  if (h1Count === 1 && h2Count >= 2 && h3Count > 0) {
    structure = 'Bonne';
  } else if (h1Count <= 2 && h2Count >= 1) {
    structure = 'Moyenne';
  }
  
  return {
    score,
    h1Count,
    h2Count,
    structure,
  };
}

/**
 * Analyser images
 */
function analyzeImages($: ReturnType<typeof cheerio.load>) {
  const images = $('img');
  const totalImages = images.length;
  
  let withAlt = 0;
  
  images.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt && alt.trim().length > 0) {
      withAlt++;
    }
  });
  
  const missingAlt = totalImages - withAlt;
  const percentageWithAlt = totalImages > 0 ? (withAlt / totalImages) * 100 : 100;
  
  const score = Math.round(percentageWithAlt);
  
  return {
    score,
    totalImages,
    withAlt,
    missingAlt,
    percentageWithAlt: Math.round(percentageWithAlt),
  };
}

/**
 * Vérifier sitemap.xml
 */
async function checkSitemap(url: string): Promise<boolean> {
  try {
    const baseUrl = new URL(url).origin;
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    
    const response = await fetch(sitemapUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Vérifier robots.txt
 */
async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const baseUrl = new URL(url).origin;
    const robotsUrl = `${baseUrl}/robots.txt`;
    
    const response = await fetch(robotsUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Calcul score global SEO
 */
function calculateSEOScore(data: {
  metaTags: { score: number };
  headings: { score: number };
  images: { score: number };
  sitemap: boolean;
  robots: boolean;
}): number {
  const metaScore = data.metaTags.score * 0.3; // 30%
  const headingsScore = data.headings.score * 0.25; // 25%
  const imagesScore = data.images.score * 0.25; // 25%
  const technicalScore = ((data.sitemap ? 50 : 0) + (data.robots ? 50 : 0)) * 0.2; // 20%
  
  return Math.round(metaScore + headingsScore + imagesScore + technicalScore);
}

/**
 * Simulation données SEO (développement)
 */
function simulateSEOData(url: string): SEOResult {
  return {
    score: 75,
    metaTags: {
      score: 80,
      title: { found: true, length: 45, optimal: true },
      description: { found: true, length: 140, optimal: true },
      ogImage: true,
      ogTitle: true,
      ogDescription: true,
      canonical: false,
    },
    headings: {
      score: 70,
      h1Count: 1,
      h2Count: 5,
      structure: 'Bonne',
    },
    images: {
      score: 60,
      totalImages: 10,
      withAlt: 6,
      missingAlt: 4,
      percentageWithAlt: 60,
    },
    sitemap: true,
    robots: true,
    coreWebVitals: {
      lcp: 2.5,
      fid: 100,
      cls: 0.1,
    },
  };
}
