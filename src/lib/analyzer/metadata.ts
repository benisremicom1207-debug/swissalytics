import type { CheerioAPI } from './cheerio';
import type { MetadataAnalysis, EEATSignals, Issue } from '../types';

function detectEEAT($: CheerioAPI): EEATSignals {
  // Author detection
  let hasAuthor = false;
  let authorName: string | null = null;

  // Check JSON-LD for Person type
  $('script[type="application/ld+json"]').each((_: number, el: any) => {
    try {
      const parsed = JSON.parse($(el).html() || '');
      const items = parsed['@graph'] || (Array.isArray(parsed) ? parsed : [parsed]);
      for (const item of items) {
        if (item['@type'] === 'Person' || item.author) {
          hasAuthor = true;
          const author = item.author || item;
          authorName = typeof author === 'string' ? author : (author.name || null);
        }
      }
    } catch { /* ignore */ }
  });

  // HTML-based author detection
  if (!hasAuthor) {
    const authorEl = $('[rel="author"], [itemprop="author"], .author, .byline').first();
    if (authorEl.length) {
      hasAuthor = true;
      authorName = authorEl.text().trim() || null;
    }
  }

  // Date detection
  let hasPublishedDate = false;
  let publishedDate: string | null = null;
  let hasModifiedDate = false;
  let modifiedDate: string | null = null;

  // Check JSON-LD dates
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const parsed = JSON.parse($(el).html() || '');
      const items = parsed['@graph'] || (Array.isArray(parsed) ? parsed : [parsed]);
      for (const item of items) {
        if (item.datePublished) { hasPublishedDate = true; publishedDate = item.datePublished; }
        if (item.dateModified) { hasModifiedDate = true; modifiedDate = item.dateModified; }
      }
    } catch { /* ignore */ }
  });

  // HTML-based date detection
  if (!hasPublishedDate) {
    const timeEl = $('time[datetime], [itemprop="datePublished"]').first();
    if (timeEl.length) {
      hasPublishedDate = true;
      publishedDate = timeEl.attr('datetime') || timeEl.text().trim() || null;
    }
  }
  if (!hasModifiedDate) {
    const modEl = $('[itemprop="dateModified"]').first();
    if (modEl.length) {
      hasModifiedDate = true;
      modifiedDate = modEl.attr('datetime') || modEl.text().trim() || null;
    }
  }

  // Trust links detection
  const allHrefs: string[] = [];
  $('a[href]').each((_: number, el: any) => {
    allHrefs.push(($(el).attr('href') || '').toLowerCase());
  });

  const hasContactLink = allHrefs.some(h => /\/(contact|about|a-propos|qui-sommes-nous)/.test(h));
  const hasPrivacyPolicy = allHrefs.some(h => /\/(privacy|confidentialite|politique-de-confidentialite|rgpd|donnees-personnelles)/.test(h));
  const hasTermsOfService = allHrefs.some(h => /\/(mentions-legales|cgu|cgv|terms|legal|conditions)/.test(h));

  let signalCount = 0;
  if (hasAuthor) signalCount++;
  if (hasPublishedDate || hasModifiedDate) signalCount++;
  if (hasContactLink) signalCount++;
  if (hasPrivacyPolicy) signalCount++;
  if (hasTermsOfService) signalCount++;

  return {
    hasAuthor, authorName,
    hasPublishedDate, publishedDate,
    hasModifiedDate, modifiedDate,
    hasContactLink, hasPrivacyPolicy, hasTermsOfService,
    signalCount,
  };
}

export function analyzeMetadata($: CheerioAPI, pageUrl: string = ''): MetadataAnalysis {
  const issues: Issue[] = [];

  const og = (prop: string) => $(`meta[property="og:${prop}"]`).attr('content') || null;
  const tw = (name: string) => $(`meta[name="twitter:${name}"]`).attr('content') || null;

  const ogTitle = og('title');
  const ogDescription = og('description');
  let ogImage = og('image');
  const ogUrl = og('url');
  const ogType = og('type');
  const twitterCard = tw('card');
  const twitterTitle = tw('title');
  const twitterDescription = tw('description');
  let twitterImage = tw('image');

  // Resolve relative image URLs
  if (ogImage && pageUrl) {
    try { ogImage = new URL(ogImage, pageUrl).href; } catch { /* keep as is */ }
  }
  if (twitterImage && pageUrl) {
    try { twitterImage = new URL(twitterImage, pageUrl).href; } catch { /* keep as is */ }
  }

  const favicon =
    $('link[rel="icon"]').attr('href') ||
    $('link[rel="shortcut icon"]').attr('href') ||
    $('link[rel="apple-touch-icon"]').attr('href') ||
    null;

  const robots = $('meta[name="robots"]').attr('content') || $('meta[name="googlebot"]').attr('content') || null;

  const hreflang: { lang: string; href: string }[] = [];
  $('link[rel="alternate"][hreflang]').each((_: number, el: any) => {
    const lang = $(el).attr('hreflang') || '';
    const href = $(el).attr('href') || '';
    if (lang && href) {
      hreflang.push({ lang, href });
    }
  });

  // Structured data (JSON-LD)
  const structuredTypes: string[] = [];
  $('script[type="application/ld+json"]').each((_: number, el: any) => {
    try {
      const content = $(el).html() || '';
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        parsed.forEach(item => {
          if (item['@type']) structuredTypes.push(String(item['@type']));
        });
      } else if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
        parsed['@graph'].forEach((item: Record<string, unknown>) => {
          if (item['@type']) structuredTypes.push(String(item['@type']));
        });
      } else if (parsed['@type']) {
        structuredTypes.push(String(parsed['@type']));
      }
    } catch {
      // Invalid JSON-LD
    }
  });

  const structuredData = {
    exists: structuredTypes.length > 0,
    types: [...new Set(structuredTypes)],
  };

  // Issues
  if (!ogTitle) issues.push({ type: 'error', message: 'og:title manquant' });
  if (!ogDescription) issues.push({ type: 'error', message: 'og:description manquant' });
  if (!ogImage) issues.push({ type: 'warning', message: 'og:image manquant — pas d\'aperçu lors du partage social' });
  if (!ogUrl) issues.push({ type: 'info', message: 'og:url manquant' });
  if (!ogType) issues.push({ type: 'info', message: 'og:type manquant' });
  if (!twitterCard) issues.push({ type: 'warning', message: 'twitter:card manquant — pas d\'aperçu riche sur X/Twitter' });
  if (!favicon) issues.push({ type: 'warning', message: 'Favicon non détecté' });

  if (!structuredData.exists) {
    issues.push({ type: 'warning', message: 'Aucune donnée structurée (JSON-LD) — recommandé pour les rich snippets Google' });
  }

  if (robots && robots.includes('noindex')) {
    issues.push({ type: 'error', message: 'La page est en noindex — elle ne sera pas indexée par Google' });
  }

  if (ogTitle && ogTitle.length > 90) {
    issues.push({ type: 'info', message: `og:title trop long (${ogTitle.length} car.) — recommandé: max 90` });
  }

  if (ogDescription && ogDescription.length > 200) {
    issues.push({ type: 'info', message: `og:description trop long (${ogDescription.length} car.) — recommandé: max 200` });
  }

  // Scoring — strict
  let score = 100;

  // Open Graph (max -40)
  if (!ogTitle) score -= 15;
  if (!ogDescription) score -= 12;
  if (!ogImage) score -= 10;
  if (!ogUrl) score -= 3;

  // Twitter (max -15)
  if (!twitterCard) score -= 8;
  if (!twitterTitle && !ogTitle) score -= 4;
  if (!twitterImage && !ogImage) score -= 3;

  // Structured data (max -12)
  if (!structuredData.exists) score -= 12;

  // Favicon (max -5)
  if (!favicon) score -= 5;

  // Noindex penalty
  if (robots && robots.includes('noindex')) score -= 20;

  // Duplicate meta detection
  const titleCount = $('title').length;
  const descriptionCount = $('meta[name="description"]').length;
  const titleText = $('title').first().text().trim();
  const titleMatchesOg = ogTitle ? titleText === ogTitle : true;
  const duplicates = { titleCount, descriptionCount, titleMatchesOg };

  if (titleCount > 1) {
    issues.push({ type: 'warning', message: `Balise <title> dupliquée (${titleCount} fois) — une seule est recommandée` });
  }
  if (descriptionCount > 1) {
    issues.push({ type: 'warning', message: `Meta description dupliquée (${descriptionCount} fois) — une seule est recommandée` });
  }
  if (ogTitle && titleText && !titleMatchesOg) {
    issues.push({ type: 'info', message: 'Le title et og:title sont différents — vérifiez la cohérence' });
  }

  // E-E-A-T
  const eeat = detectEEAT($);

  if (!eeat.hasPrivacyPolicy) {
    issues.push({ type: 'warning', message: 'Politique de confidentialité absente — obligatoire LPD/RGPD' });
  }
  if (!eeat.hasAuthor) {
    issues.push({ type: 'info', message: 'Auteur non identifié — recommandé pour les signaux E-E-A-T' });
  }
  if (!eeat.hasPublishedDate && !eeat.hasModifiedDate) {
    issues.push({ type: 'info', message: 'Dates de publication/modification absentes — utiles pour E-E-A-T' });
  }
  if (!eeat.hasContactLink) {
    issues.push({ type: 'info', message: 'Lien de contact absent — recommandé pour la confiance E-E-A-T' });
  }
  if (!eeat.hasTermsOfService) {
    issues.push({ type: 'info', message: 'Mentions légales absentes — recommandées pour la confiance' });
  }

  // E-E-A-T scoring
  if (eeat.signalCount <= 1) score -= 10;
  else if (eeat.signalCount <= 2) score -= 6;
  else if (eeat.signalCount <= 3) score -= 3;
  if (!eeat.hasPrivacyPolicy) score -= 3;

  // Duplicate meta penalties
  if (titleCount > 1) score -= 5;
  if (descriptionCount > 1) score -= 5;
  if (!titleMatchesOg && ogTitle && titleText) score -= 2;

  return {
    score: Math.max(0, Math.min(100, score)),
    ogTitle, ogDescription, ogImage, ogUrl, ogType,
    twitterCard, twitterTitle, twitterDescription, twitterImage,
    favicon,
    robots,
    hreflang,
    structuredData,
    eeat,
    duplicates,
    issues,
  };
}
