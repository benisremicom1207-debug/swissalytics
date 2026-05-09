import type { CheerioAPI } from './cheerio';
import type { KeywordInfo, KeywordsAnalysis, KeywordPlacement, Issue } from '../types';

// French + English stop words + code noise
const STOP_WORDS = new Set([
  // French
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'est', 'que',
  'qui', 'dans', 'ce', 'il', 'ne', 'sur', 'se', 'pas', 'plus', 'par', 'au', 'aux',
  'son', 'sa', 'ses', 'ou', 'mais', 'sont', 'pour', 'avec', 'tout', 'nous', 'vous',
  'ils', 'elle', 'elles', 'été', 'être', 'avoir', 'fait', 'faire', 'comme',
  'était', 'ont', 'cette', 'bien', 'peut', 'entre', 'aussi', 'lui', 'après',
  'leurs', 'nos', 'votre', 'notre', 'même', 'ces', 'dont', 'très', 'tous',
  'toute', 'toutes', 'sous', 'autre', 'autres', 'quand', 'depuis', 'sans',
  'vers', 'chez', 'donc', 'car', 'si', 'non', 'oui', 'peu', 'encore',
  'ici', 'là', 'alors', 'ainsi', 'avant', 'où', 'deux', 'trois', 'fois',
  'plus', 'moins', 'chaque', 'tel', 'telle', 'cet', 'ceux', 'celle',
  'celles', 'lors', 'mes', 'tes', 'ton', 'ma', 'mon',
  // English
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
  'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'also', 'after', 'use', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'most', 'us',
  // Code noise — common JS/HTML terms that leak into body text
  'function', 'var', 'return', 'true', 'false', 'null', 'undefined', 'this',
  'const', 'let', 'class', 'typeof', 'document', 'window', 'jquery',
  'width', 'height', 'attr', 'each', 'data', 'val', 'html', 'css',
  'obj', 'arr', 'push', 'pop', 'length', 'index', 'value', 'type',
  'click', 'event', 'target', 'parent', 'find', 'text', 'ajax',
  'append', 'remove', 'show', 'hide', 'toggle', 'ready', 'load',
  'error', 'success', 'url', 'string', 'number', 'boolean', 'object',
  'else', 'switch', 'case', 'break', 'default', 'try', 'catch',
  'prototype', 'constructor', 'foreach', 'map', 'filter', 'reduce',
  'search', 'replace', 'match', 'test', 'split', 'join', 'slice',
  'fields', 'field', 'input', 'form', 'select', 'option', 'submit',
  'container', 'wrapper', 'content', 'item', 'items', 'list', 'block',
  'header', 'footer', 'section', 'main', 'nav', 'div', 'span',
  'img', 'src', 'alt', 'href', 'rel', 'title', 'name', 'id',
  'localite', 'prix', 'display', 'none', 'flex', 'inline',
]);

/**
 * Brand exclusion (P9.1) — return the set of brand-derived words to filter
 * out of the candidate keywords. Without this, sites that name themselves
 * heavily ("Sunrise" on sunrise.ch, "Pixelab" on pixelab.ch) end up with
 * the brand name as their detected primary keyword, which is useless for
 * SEO targeting and triggers absurd alerts ("brand absent du H1").
 *
 * Conservative rules:
 *   - strip leading www. and the final TLD label
 *   - split remaining hostname on '.' and '-'
 *   - keep parts of length >= 3 (so 'co'/'uk' from example.co.uk don't fire)
 *   - also include the de-hyphenated concatenation (pixelab-ch → pixelabch)
 */
export function getBrandVariants(url: string | undefined): Set<string> {
  if (!url) return new Set();
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return new Set();
  }
  host = host.replace(/^www\./, '');
  const labels = host.split('.');
  if (labels.length > 1) labels.pop(); // drop TLD

  const variants = new Set<string>();
  for (const label of labels) {
    for (const part of label.split('-')) {
      if (part.length >= 3) variants.add(part);
    }
    const concat = label.replace(/-/g, '');
    if (concat.length >= 3) variants.add(concat);
  }
  return variants;
}

/**
 * Best human-readable brand label for display — typically the first
 * hostname label minus TLD. Returns undefined if URL can't be parsed.
 *   sunrise.ch              → 'sunrise'
 *   www.pixelab-design.com  → 'pixelab-design'
 *   blog.example.co.uk      → 'blog' (subdomain wins; rare in practice)
 */
export function getBrandPrincipal(url: string | undefined): string | undefined {
  if (!url) return undefined;
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
  host = host.replace(/^www\./, '');
  const labels = host.split('.');
  if (labels.length > 1) labels.pop();
  const first = labels[0];
  return first && first.length >= 2 ? first : undefined;
}

function extractKeywords($: CheerioAPI, brandVariants: Set<string>): KeywordInfo[] {
  const titleText = $('title').text().trim();
  const h1Text = $('h1').map((_, el) => $(el).text().trim()).get().join(' ');
  const h2Text = $('h2').map((_, el) => $(el).text().trim()).get().join(' ');
  const h3Text = $('h3').map((_, el) => $(el).text().trim()).get().join(' ');
  const metaDesc = $('meta[name="description"]').attr('content') || '';

  const pText = $('p').map((_, el) => $(el).text().trim()).get().join(' ');
  const liText = $('li').map((_, el) => $(el).text().trim()).get().join(' ');
  const aText = $('a').map((_, el) => $(el).text().trim()).get().join(' ');

  const weightedText = [
    ...Array(4).fill(titleText),
    ...Array(4).fill(h1Text),
    ...Array(3).fill(h2Text),
    ...Array(2).fill(h3Text),
    ...Array(2).fill(metaDesc),
    pText,
    liText,
    aText,
  ].join(' ');

  const words = weightedText
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûüÿç0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w =>
      w.length >= 3 &&
      !STOP_WORDS.has(w) &&
      !brandVariants.has(w) &&
      !/^\d+$/.test(w) &&
      !/^[a-z]$/.test(w),
    );

  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));
}

export function analyzeKeywords($: CheerioAPI, url?: string): KeywordsAnalysis {
  const brandVariants = getBrandVariants(url);
  const keywords = extractKeywords($, brandVariants);
  const issues: Issue[] = [];

  if (keywords.length === 0) {
    return { keywords, placement: null, issues };
  }

  const primary = keywords[0].word;

  // Get raw text from content elements (NOT using $.remove())
  const titleText = $('title').text().trim().toLowerCase();
  const h1Text = $('h1').map((_, el) => $(el).text().trim()).get().join(' ').toLowerCase();
  const metaDesc = ($('meta[name="description"]').attr('content') || '').toLowerCase();

  // Extract body text from meaningful elements for first 100 words check
  const bodyParts: string[] = [];
  $('p, li, td, blockquote').each((_, el) => {
    bodyParts.push($(el).text().trim());
  });
  const bodyText = bodyParts.join(' ').toLowerCase();
  const bodyWords = bodyText.split(/\s+/).filter(w => w.length > 0);
  const first100Words = bodyWords.slice(0, 100).join(' ');
  const totalWords = bodyWords.length;

  const inTitle = titleText.includes(primary);
  const inH1 = h1Text.includes(primary);
  const inMetaDescription = metaDesc.includes(primary);
  const inFirst100Words = first100Words.includes(primary);

  // Count occurrences in full body text
  const escaped = primary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
  const matches = bodyText.match(regex);
  const keywordCount = matches ? matches.length : 0;
  const density = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;

  let densityStatus: 'low' | 'optimal' | 'high';
  if (density < 1) densityStatus = 'low';
  else if (density > 3) densityStatus = 'high';
  else densityStatus = 'optimal';

  // Generate issues
  if (!inTitle) {
    issues.push({ type: 'error', message: `Le mot-clé principal « ${primary} » est absent du titre` });
  }
  if (!inH1) {
    issues.push({ type: 'error', message: `Le mot-clé principal « ${primary} » est absent du H1` });
  }
  if (!inMetaDescription) {
    issues.push({ type: 'warning', message: `Le mot-clé principal « ${primary} » est absent de la méta description` });
  }
  if (!inFirst100Words) {
    issues.push({ type: 'warning', message: `Le mot-clé principal « ${primary} » est absent des 100 premiers mots` });
  }
  if (density > 3) {
    issues.push({ type: 'warning', message: `Densité du mot-clé « ${primary} » trop élevée (${density.toFixed(1)}%) — risque de suroptimisation` });
  }
  if (density < 1 && totalWords > 100) {
    issues.push({ type: 'info', message: `Densité du mot-clé « ${primary} » faible (${density.toFixed(1)}%) — envisagez de l'utiliser davantage` });
  }

  // P9.1 — surface the brand separately for the UI ("brand detected: sunrise (75×)")
  // even though it was excluded from candidate keywords. Counts mentions in body
  // text only (matches how density/totalWords are computed above).
  const brand = getBrandPrincipal(url);
  let brandMentions: number | undefined;
  if (brand) {
    const brandEscaped = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const brandRegex = new RegExp(`\\b${brandEscaped}\\b`, 'gi');
    brandMentions = (bodyText.match(brandRegex) || []).length;
  }

  const placement: KeywordPlacement = {
    primary,
    inTitle,
    inH1,
    inMetaDescription,
    inFirst100Words,
    density: Math.round(density * 100) / 100,
    densityStatus,
    totalWords,
    keywordCount,
    brand,
    brandMentions,
  };

  return { keywords, placement, issues };
}
