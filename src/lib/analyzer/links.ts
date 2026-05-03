import type { CheerioAPI } from './cheerio';
import https from 'https';
import http from 'http';
import type { LinksAnalysis, LinkInfo, BrokenLink, Issue } from '../types';
import { validateUrl } from '@/lib/security';

const GENERIC_ANCHORS = [
  'cliquez ici', 'click here', 'lire la suite', 'en savoir plus', 'read more',
  'voir plus', 'plus', 'ici', 'lien', 'link', 'here', 'suite', 'more',
  'découvrir', 'voir', 'cliquer', 'afficher', 'ouvrir',
];

async function checkLink(href: string): Promise<{ href: string; status: number; error?: string }> {
  try {
    await validateUrl(href);
  } catch {
    return { href, status: 0, error: 'skipped (private/invalid)' };
  }

  const doRequest = (method: string): Promise<{ href: string; status: number; error?: string }> => {
    return new Promise((resolve) => {
      try {
        const parsedUrl = new URL(href);
        const mod = parsedUrl.protocol === 'https:' ? https : http;

        const req = mod.request({
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method,
          timeout: 2000,
          rejectUnauthorized: false,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEO-Analyzer/1.0)',
          },
        }, (res) => {
          if (method === 'GET') req.destroy();
          resolve({ href, status: res.statusCode || 0 });
        });
        req.on('timeout', () => { req.destroy(); resolve({ href, status: 0, error: 'timeout' }); });
        req.on('error', (err) => resolve({ href, status: 0, error: err.message }));
        req.end();
      } catch {
        resolve({ href, status: 0, error: 'invalid URL' });
      }
    });
  };

  const headResult = await doRequest('HEAD');

  // Retry with GET if HEAD is rejected
  if (headResult.status === 405 || headResult.status === 403) {
    return doRequest('GET');
  }

  return headResult;
}

export async function analyzeLinks($: CheerioAPI, pageUrl: string): Promise<LinksAnalysis> {
  const issues: Issue[] = [];
  const internal: LinkInfo[] = [];
  const external: LinkInfo[] = [];
  let nofollowCount = 0;
  let dofollowCount = 0;
  let emptyAnchors = 0;
  let genericAnchors = 0;
  let withImages = 0;
  const anchorTexts = new Set<string>();

  let baseHost: string;
  try {
    baseHost = new URL(pageUrl).hostname;
  } catch {
    baseHost = '';
  }

  $('a[href]').each((_, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    const text = $el.text().trim();
    const rel = ($el.attr('rel') || '').toLowerCase();
    const isNofollow = rel.includes('nofollow');
    const isSponsored = rel.includes('sponsored');
    const isUgc = rel.includes('ugc');
    const hasImage = $el.find('img').length > 0;

    if (isNofollow) nofollowCount++;
    else dofollowCount++;

    if (hasImage) withImages++;

    if (!text && !hasImage) {
      emptyAnchors++;
    } else if (text) {
      anchorTexts.add(text.toLowerCase());
      if (GENERIC_ANCHORS.some(g => text.toLowerCase() === g || text.toLowerCase().includes(g))) {
        genericAnchors++;
      }
    }

    if (href.startsWith('javascript:')) {
      issues.push({ type: 'warning', message: `Lien avec javascript: href détecté: "${text || href}"` });
      return;
    }

    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }

    let isExternal = false;
    try {
      const linkUrl = new URL(href, pageUrl);
      isExternal = linkUrl.hostname !== baseHost;
    } catch {
      isExternal = false;
    }

    const linkInfo: LinkInfo = { href, text, isNofollow, isSponsored, isUgc, isExternal };

    if (isExternal) {
      external.push(linkInfo);
    } else {
      internal.push(linkInfo);
    }
  });

  const total = internal.length + external.length;

  if (internal.length === 0) {
    issues.push({ type: 'warning', message: 'Aucun lien interne trouvé' });
  }

  if (external.length > total * 0.7 && total > 5) {
    issues.push({ type: 'warning', message: 'Trop de liens externes par rapport aux liens internes' });
  }

  if (emptyAnchors > 0) {
    issues.push({ type: 'warning', message: `${emptyAnchors} lien(s) sans texte d'ancrage ni image` });
  }

  if (genericAnchors > 3) {
    issues.push({ type: 'info', message: `${genericAnchors} lien(s) avec un texte d'ancrage générique (ex: "cliquez ici", "en savoir plus")` });
  }

  if (nofollowCount > total * 0.5 && total > 5) {
    issues.push({ type: 'info', message: `${nofollowCount} liens nofollow sur ${total} total — ratio élevé` });
  }

  if (total === 0) {
    issues.push({ type: 'warning', message: 'Aucun lien trouvé sur la page' });
  }

  // Check broken links — sample max 5 external + 5 internal, in parallel
  const brokenLinks: BrokenLink[] = [];
  const internalBrokenLinks: BrokenLink[] = [];

  const externalToCheck = external
    .filter(l => {
      try { new URL(l.href, pageUrl); return true; } catch { return false; }
    })
    .map(l => {
      try { return new URL(l.href, pageUrl).href; } catch { return l.href; }
    })
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 5);

  const internalToCheck = internal
    .filter(l => {
      try { new URL(l.href, pageUrl); return true; } catch { return false; }
    })
    .map(l => {
      try { return new URL(l.href, pageUrl).href; } catch { return l.href; }
    })
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 5);

  // Run both batches in parallel
  const [externalResults, internalResults] = await Promise.all([
    externalToCheck.length > 0
      ? Promise.allSettled(externalToCheck.map(href => checkLink(href)))
      : Promise.resolve([]),
    internalToCheck.length > 0
      ? Promise.allSettled(internalToCheck.map(href => checkLink(href)))
      : Promise.resolve([]),
  ]);

  for (const r of externalResults) {
    if (r.status === 'fulfilled') {
      const { href, status, error } = r.value;
      if (status === 404) {
        brokenLinks.push({ href, status: 404 });
        issues.push({ type: 'error', message: `Lien cassé (404) : ${href.substring(0, 80)}` });
      } else if (status >= 500) {
        brokenLinks.push({ href, status });
        issues.push({ type: 'warning', message: `Lien en erreur serveur (${status}) : ${href.substring(0, 80)}` });
      } else if (status === 0) {
        brokenLinks.push({ href, status: 0, error });
        issues.push({ type: 'info', message: `Lien inaccessible (${error || 'timeout'}) : ${href.substring(0, 80)}` });
      }
    }
  }

  for (const r of internalResults) {
    if (r.status === 'fulfilled') {
      const { href, status, error } = r.value;
      if (status === 404) {
        internalBrokenLinks.push({ href, status: 404 });
        issues.push({ type: 'error', message: `Lien interne cassé (404) : ${href.substring(0, 80)}` });
      } else if (status >= 500) {
        internalBrokenLinks.push({ href, status });
        issues.push({ type: 'warning', message: `Lien interne en erreur serveur (${status}) : ${href.substring(0, 80)}` });
      } else if (status === 0) {
        internalBrokenLinks.push({ href, status: 0, error });
        issues.push({ type: 'info', message: `Lien interne inaccessible (${error || 'timeout'}) : ${href.substring(0, 80)}` });
      }
    }
  }

  // Scoring — strict
  let score = 100;

  if (total === 0) {
    score = 40;
  } else {
    // Internal links quality (max -15)
    if (internal.length === 0) score -= 15;
    else if (internal.length < 5) score -= 8;

    // Empty anchors (max -15)
    if (emptyAnchors > 0) {
      score -= Math.min(15, emptyAnchors * 2);
    }

    // Generic anchors (max -8)
    if (genericAnchors > 0) {
      score -= Math.min(8, genericAnchors * 2);
    }

    // External ratio too high (max -10)
    if (total > 5 && external.length > total * 0.7) {
      score -= 10;
    }

    // Anchor diversity — low unique ratio (max -5)
    // Only count links that actually have text (exclude image-only and empty-anchor links)
    const linksWithText = total - emptyAnchors - withImages;
    if (total > 10 && linksWithText > 0) {
      const diversityRatio = anchorTexts.size / linksWithText;
      if (diversityRatio < 0.3) score -= 5;
    }

    // Broken links penalties (external)
    const count404 = brokenLinks.filter(l => l.status === 404).length;
    const count5xx = brokenLinks.filter(l => l.status >= 500).length;
    score -= Math.min(10, count404 * 4);
    score -= Math.min(5, count5xx * 3);

    // Broken links penalties (internal)
    const count404Internal = internalBrokenLinks.filter(l => l.status === 404).length;
    score -= Math.min(10, count404Internal * 3);
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    total,
    internal,
    external,
    nofollow: nofollowCount,
    dofollow: dofollowCount,
    emptyAnchors,
    genericAnchors,
    withImages,
    uniqueAnchors: anchorTexts.size,
    brokenLinks,
    internalBrokenLinks,
    issues,
  };
}
