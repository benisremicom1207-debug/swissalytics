import type { CheerioAPI } from './cheerio';
import type { ImagesAnalysis, ImageInfo, Issue } from '../types';

function getFormat(src: string): string {
  try {
    const pathname = new URL(src, 'https://example.com').pathname;
    const ext = pathname.split('.').pop()?.toLowerCase() || '';
    const known = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico', 'bmp', 'tiff'];
    return known.includes(ext) ? ext : 'unknown';
  } catch {
    return 'unknown';
  }
}

function resolveUrl(src: string, baseUrl: string): string {
  if (!src) return '';
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}

export function analyzeImages($: CheerioAPI, baseUrl: string = ''): ImagesAnalysis {
  const issues: Issue[] = [];
  const images: ImageInfo[] = [];

  let missingDimensions = 0;
  let missingLazy = 0;
  let modernFormatCount = 0;

  $('img').each((i: number, el: any) => {
    const $el = $(el);
    const rawSrc = $el.attr('src') || $el.attr('data-src') || '';
    const src = resolveUrl(rawSrc, baseUrl);
    const alt = $el.attr('alt') || '';
    const hasAlt = $el.attr('alt') !== undefined;
    const width = $el.attr('width');
    const height = $el.attr('height');
    const isLazy = $el.attr('loading') === 'lazy' || !!$el.attr('data-src');
    const format = getFormat(src);
    const hasSrcset = !!$el.attr('srcset');

    images.push({ src, alt, hasAlt, width, height, isLazy, format, hasSrcset });

    if (!hasAlt) {
      issues.push({ type: 'error', message: `Image sans attribut alt: ${rawSrc.substring(0, 80)}` });
    } else if (!alt) {
      issues.push({ type: 'info', message: `Image avec alt vide (décorative): ${rawSrc.substring(0, 80)}` });
    } else if (alt.length > 125) {
      issues.push({ type: 'info', message: `Alt text très long (${alt.length} car.): ${rawSrc.substring(0, 80)}` });
    }

    if (!width || !height) {
      missingDimensions++;
    }

    // Check lazy loading — images after the first 3 should ideally be lazy
    if (i >= 3 && !isLazy && format !== 'svg') {
      missingLazy++;
    }

    // First 3 images should NOT be lazy
    if (i < 3 && isLazy) {
      issues.push({ type: 'warning', message: `Image above-the-fold avec lazy loading: ${rawSrc.substring(0, 80)}` });
    }

    // Modern formats
    if (format === 'webp' || format === 'avif') {
      modernFormatCount++;
    }
  });

  // Aggregate issues
  if (missingDimensions > 0) {
    issues.push({ type: 'info', message: `${missingDimensions} image(s) sans dimensions explicites (width/height)` });
  }

  if (missingLazy > 3) {
    issues.push({ type: 'warning', message: `${missingLazy} image(s) below-the-fold sans lazy loading` });
  }

  const nonSvgImages = images.filter(img => img.format !== 'svg' && img.format !== 'ico');
  if (nonSvgImages.length > 0 && modernFormatCount === 0) {
    issues.push({ type: 'info', message: 'Aucune image en format moderne (WebP/AVIF) — recommandé pour les performances' });
  }

  const withoutResponsive = nonSvgImages.filter(img => !img.hasSrcset).length;
  if (nonSvgImages.length > 3 && withoutResponsive === nonSvgImages.length) {
    issues.push({ type: 'info', message: 'Aucune image n\'utilise srcset — recommandé pour les images responsives' });
  }

  const withAlt = images.filter((img) => img.hasAlt).length;
  const withoutAlt = images.filter((img) => !img.hasAlt).length;

  // Scoring — strict
  let score = 100;

  if (images.length === 0) {
    score = 100; // No images = no penalty
  } else {
    // Alt coverage: biggest factor (max -40)
    const altRatio = withAlt / images.length;
    if (altRatio < 1) {
      score -= Math.round((1 - altRatio) * 40);
    }

    // Missing alt entirely (not just empty) (max -20)
    if (withoutAlt > 0) {
      score -= Math.min(20, withoutAlt * 5);
    }

    // Missing dimensions (max -10)
    if (missingDimensions > 0) {
      const dimRatio = missingDimensions / images.length;
      score -= Math.round(dimRatio * 10);
    }

    // No lazy loading (max -8)
    if (missingLazy > 3) {
      score -= Math.min(8, Math.round(missingLazy * 1.5));
    }

    // No modern formats (max -5)
    if (nonSvgImages.length > 0 && modernFormatCount === 0) {
      score -= 5;
    }

    // No responsive images (max -5)
    if (nonSvgImages.length > 3 && withoutResponsive === nonSvgImages.length) {
      score -= 5;
    }
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    total: images.length,
    withAlt,
    withoutAlt,
    withoutResponsive,
    images,
    issues,
  };
}
