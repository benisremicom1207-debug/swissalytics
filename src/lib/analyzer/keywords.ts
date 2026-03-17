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

function extractKeywords($: CheerioAPI): KeywordInfo[] {
  const titleText = $('title').text().trim();
  const h1Text = $('h1').map((_: number, el: any) => $(el).text().trim()).get().join(' ');
  const h2Text = $('h2').map((_: number, el: any) => $(el).text().trim()).get().join(' ');
  const h3Text = $('h3').map((_: number, el: any) => $(el).text().trim()).get().join(' ');
  const metaDesc = $('meta[name="description"]').attr('content') || '';

  const pText = $('p').map((_: number, el: any) => $(el).text().trim()).get().join(' ');
  const liText = $('li').map((_: number, el: any) => $(el).text().trim()).get().join(' ');
  const aText = $('a').map((_: number, el: any) => $(el).text().trim()).get().join(' ');

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
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w) && !/^[a-z]$/.test(w));

  const freq: Record<string, number> = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));
}

export function analyzeKeywords($: CheerioAPI): KeywordsAnalysis {
  const keywords = extractKeywords($);
  const issues: Issue[] = [];

  if (keywords.length === 0) {
    return { keywords, placement: null, issues };
  }

  const primary = keywords[0].word;

  // Get raw text from content elements (NOT using $.remove())
  const titleText = $('title').text().trim().toLowerCase();
  const h1Text = $('h1').map((_: number, el: any) => $(el).text().trim()).get().join(' ').toLowerCase();
  const metaDesc = ($('meta[name="description"]').attr('content') || '').toLowerCase();

  // Extract body text from meaningful elements for first 100 words check
  const bodyParts: string[] = [];
  $('p, li, td, blockquote').each((_: number, el: any) => {
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
  };

  return { keywords, placement, issues };
}
