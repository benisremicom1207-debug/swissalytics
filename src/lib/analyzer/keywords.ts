import type { CheerioAPI } from './cheerio';
import type {
  KeywordInfo,
  KeywordsAnalysis,
  KeywordPlacement,
  KeywordTarget,
  Issue,
} from '../types';
import { extractSchemaKeywords } from './schema-keywords';

// Multi-language stop words covering the 4 official Swiss languages
// (FR, EN, DE, IT) + code/JS noise. Pronouns are exhaustively covered
// because they're the most common false-positive keyword targets — a
// page repeating "you/your/dir/dein" naturally has those at high
// frequency without them being meaningful SEO targets.
const STOP_WORDS = new Set([
  // French — full pronoun coverage (subjects + objects + possessives)
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
  'je', 'tu', 'te', 'moi', 'toi', 'eux',
  // English — full pronoun coverage including reflexives + absolute possessives
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
  'mine', 'yours', 'hers', 'ours', 'theirs',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
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
  // P9.3 — CTA / nav / time / social-network noise. Excluded because
  // they appear on virtually every site as filler, not as SEO targets.
  // We deliberately do NOT include geography (suisse, paris, genève…)
  // because those CAN be legitimate targets for travel/local sites.
  // CTA + nav generics
  'accueil', 'menu', 'plus', 'voir', 'lire', 'savoir', 'cliquer', 'cliquez',
  'découvrir', 'decouvrir', 'découvrez', 'decouvrez', 'profitez', 'profiter',
  // Apostrophe artifacts (French elision splits on quote/apostrophe)
  'jusqu', 'aujourd', 'puisqu', 'lorsqu', 'qu',
  // Time / vague time references
  'maintenant', 'hier', 'demain', 'aujourdhui', 'bientôt', 'bientot',
  'dernier', 'dernière', 'derniere', 'prochain', 'prochaine', 'récent', 'recent',
  // Social networks (almost always footer/nav noise, not the page topic)
  'linkedin', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok',
  'whatsapp', 'telegram', 'snapchat', 'pinterest', 'reddit', 'discord',
  // English filler equivalents
  'click', 'learn', 'discover', 'read', 'now', 'today', 'yesterday', 'tomorrow',
  'soon', 'recent', 'latest', 'new', 'menu', 'home', 'page',
  // German stop words — major Swiss language (DE/CH-DE sites). Found via
  // upc.ch smoke test where 'und' (and), 'die' (the), 'mit' (with), 'bis'
  // (until) were polluting the top-12. Pronoun coverage extended after
  // go-mo.ch leaked 'dir' as a keyword target.
  'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einer', 'eines', 'einem', 'einen',
  'und', 'oder', 'aber', 'auch', 'als', 'wie', 'wenn', 'weil', 'dass',
  'ist', 'sind', 'war', 'waren', 'sein', 'haben', 'hat', 'hatte', 'wird', 'werden',
  'mit', 'für', 'von', 'auf', 'aus', 'bei', 'bis', 'nach', 'über', 'unter',
  'durch', 'gegen', 'ohne', 'um', 'vor', 'zwischen', 'seit',
  'ich', 'mich', 'mir',
  'du', 'dich', 'dir',
  'er', 'es', 'ihn', 'ihm',
  'wir', 'uns', 'unser', 'unsere',
  'ihr', 'ihre', 'ihrer', 'euch', 'euer', 'eure',
  'sie', 'ihnen',
  'dein', 'deine', 'mein', 'meine', 'seine',
  'nicht', 'kein', 'keine', 'nur', 'noch', 'auch', 'mehr', 'alle', 'alles',
  'jetzt', 'heute', 'morgen', 'gestern', 'bald',
  'diese', 'dieser', 'dieses', 'jene', 'jener',
  // Italian — 4th Swiss official language (~8% pop., Ticino + Grisons).
  // Was completely absent until now. Same shape as DE: articles,
  // prepositions, auxiliaries, full pronoun set, demonstratives.
  // Articles + indef
  'il', 'lo', 'gli', 'i', 'un', 'uno',
  // Conjunctions
  'ed', 'anche', 'ma', 'mentre', 'perché', 'perche', 'quando', 'come',
  'oppure',
  // Prepositions (simple + articulate)
  'di', 'da', 'su', 'per', 'tra', 'fra',
  'al', 'allo', 'alla', 'agli', 'alle', 'ai',
  'dal', 'dallo', 'dalla', 'dagli', 'dalle', 'dai',
  'del', 'dello', 'della', 'degli', 'delle', 'dei',
  'nel', 'nello', 'nella', 'negli', 'nelle', 'nei',
  'sul', 'sullo', 'sulla', 'sugli', 'sulle', 'sui',
  // Aux + common verbs
  'è', 'sono', 'sei', 'siamo', 'siete', 'era', 'erano', 'sarà', 'saranno',
  'ho', 'ha', 'hai', 'hanno', 'abbiamo', 'avete', 'avere', 'essere',
  // Full pronoun set (subjects + clitics + reflexives)
  'io', 'lei', 'noi', 'voi', 'loro',
  'mi', 'ti', 'ci', 'vi', 'sé',
  // Possessives (m/f, sing/plur)
  'mio', 'mia', 'miei', 'mie',
  'tuo', 'tua', 'tuoi', 'tue',
  'suo', 'sua', 'suoi', 'sue',
  'nostro', 'nostra', 'nostri', 'nostre',
  'vostro', 'vostra', 'vostri', 'vostre',
  // Common adverbs / quantifiers / negation
  'già', 'gia', 'ancora', 'sempre', 'mai', 'molto', 'poco', 'troppo', 'tanto',
  'tutto', 'tutti', 'tutta', 'tutte',
  'qui', 'qua', 'lì', 'là', 'ora', 'oggi', 'ieri', 'domani', 'presto',
  // Demonstratives
  'questo', 'questa', 'questi', 'queste',
  'quello', 'quella', 'quelli', 'quelle',
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

/**
 * Per-position weighting (P9.4) — replaces the previous Array(N).fill pattern.
 * Each section is tokenized once; word frequencies are summed weighted by
 * position priority. Title/H1 dominate, body is the baseline.
 *
 * Weights are intentionally close to industry SEO heuristics (Yoast, Surfer)
 * with title slightly boosted. Tunable in one place.
 */
const SECTION_WEIGHTS = {
  title: 10,
  h1: 8,
  h2: 4,
  meta: 4,
  h3: 2,
  body: 1,
} as const;

/**
 * N-gram size boosts (P9.2) — multiplied with the section weight when a
 * sequence of N consecutive candidate words appears. Compensates for the
 * natural rarity of multi-word phrases vs single words: without a boost
 * "internet" (37 mentions) would always crush "internet mobile" (5).
 *
 *   1 = baseline      (single word, no boost)
 *   2 = ×1.5          (bigrams: "carte sim", "abonnement mobile")
 *   3 = ×2            (trigrams: "abonnement internet illimité")
 */
const N_GRAM_BOOSTS: Record<1 | 2 | 3, number> = { 1: 1, 2: 1.5, 3: 2 };

function isCandidateWord(w: string, brandVariants: Set<string>): boolean {
  return (
    w.length >= 3 &&
    !STOP_WORDS.has(w) &&
    !brandVariants.has(w) &&
    !/^\d+$/.test(w) &&
    !/^[a-z]$/.test(w)
  );
}

function rawTokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûüÿç0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

/**
 * Extract n-grams from a token list. For n=1 this is just the candidate
 * words filter. For n>1 we require BOTH the first and last token to be
 * candidates (so "à très haut" is rejected — both 'à' and 'très' are
 * stop words at the boundary). Internal stop words are tolerated to
 * keep useful phrases like "carte de fidélité" (where "de" is internal).
 */
function extractNGrams(
  tokens: string[],
  n: 1 | 2 | 3,
  brandVariants: Set<string>,
): string[] {
  if (n === 1) {
    return tokens.filter(w => isCandidateWord(w, brandVariants));
  }
  const out: string[] = [];
  for (let i = 0; i + n <= tokens.length; i++) {
    if (!isCandidateWord(tokens[i], brandVariants)) continue;
    if (!isCandidateWord(tokens[i + n - 1], brandVariants)) continue;
    out.push(tokens.slice(i, i + n).join(' '));
  }
  return out;
}

/**
 * Pick the top-N distinct keyword targets (P13). Iterates the score-sorted
 * list and skips any candidate that shares ANY word with an already-selected
 * target — so "internet at maximum" is dropped after "internet" wins.
 *
 * This matches how SEO teams actually plan: 1 primary + 2-3 secondary
 * keywords per page, each covering a DIFFERENT theme. A site like salt.ch
 * legitimately targets internet, mobile, AND calls — three distinct themes.
 */
export function selectTopTargets(keywords: KeywordInfo[], n: number): KeywordInfo[] {
  const selected: KeywordInfo[] = [];
  const usedWords = new Set<string>();
  for (const kw of keywords) {
    if (selected.length >= n) break;
    const candidateWords = kw.word.split(/\s+/);
    if (candidateWords.some((w) => usedWords.has(w))) continue;
    selected.push(kw);
    candidateWords.forEach((w) => usedWords.add(w));
  }
  return selected;
}

/**
 * Per-target placement check (P13). Returns whether the keyword/phrase
 * appears in each of the four canonical SEO zones for the page.
 * Used by both `analyzeKeywords` (for top-3 targets) and indirectly by
 * the existing `placement` payload (which mirrors target #0).
 */
function checkPlacement(
  word: string,
  texts: { title: string; h1: string; meta: string; first100: string },
): Pick<KeywordTarget, 'inTitle' | 'inH1' | 'inMetaDescription' | 'inFirst100Words'> {
  const w = word.toLowerCase();
  return {
    inTitle: texts.title.includes(w),
    inH1: texts.h1.includes(w),
    inMetaDescription: texts.meta.includes(w),
    inFirst100Words: texts.first100.includes(w),
  };
}

function extractKeywords($: CheerioAPI, brandVariants: Set<string>): KeywordInfo[] {
  const sections: { text: string; weight: number }[] = [
    { text: $('title').text().trim(), weight: SECTION_WEIGHTS.title },
    { text: $('h1').map((_, el) => $(el).text().trim()).get().join(' '), weight: SECTION_WEIGHTS.h1 },
    { text: $('h2').map((_, el) => $(el).text().trim()).get().join(' '), weight: SECTION_WEIGHTS.h2 },
    { text: $('h3').map((_, el) => $(el).text().trim()).get().join(' '), weight: SECTION_WEIGHTS.h3 },
    { text: $('meta[name="description"]').attr('content') || '', weight: SECTION_WEIGHTS.meta },
    { text: $('p').map((_, el) => $(el).text().trim()).get().join(' '), weight: SECTION_WEIGHTS.body },
    { text: $('li').map((_, el) => $(el).text().trim()).get().join(' '), weight: SECTION_WEIGHTS.body },
    { text: $('a').map((_, el) => $(el).text().trim()).get().join(' '), weight: SECTION_WEIGHTS.body },
  ];

  const freq: Record<string, number> = {};
  for (const section of sections) {
    const tokens = rawTokenize(section.text);
    for (const n of [1, 2, 3] as const) {
      const ngrams = extractNGrams(tokens, n, brandVariants);
      const boost = N_GRAM_BOOSTS[n];
      const weight = section.weight * boost;
      for (const ngram of ngrams) {
        freq[ngram] = (freq[ngram] || 0) + weight;
      }
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word, count]) => ({ word, count }));
}

export function analyzeKeywords($: CheerioAPI, url?: string): KeywordsAnalysis {
  const brandVariants = getBrandVariants(url);
  const keywords = extractKeywords($, brandVariants);
  const schemaKeywords = extractSchemaKeywords($); // P14.A
  const issues: Issue[] = [];

  if (keywords.length === 0) {
    return { keywords, placement: null, targets: [], schemaKeywords, issues };
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

  // P13 — top-3 distinct targets. targets[0] mirrors `placement` for
  // consistency; targets[1] and [2] are adjacent themes (e.g. salt.ch
  // → internet, mobile, calls). Each gets its own placement check.
  const placementTexts = {
    title: titleText,
    h1: h1Text,
    meta: metaDesc,
    first100: first100Words,
  };
  const targets: KeywordTarget[] = selectTopTargets(keywords, 3).map((kw) => ({
    word: kw.word,
    score: kw.count,
    ...checkPlacement(kw.word, placementTexts),
  }));

  return { keywords, placement, targets, schemaKeywords, issues };
}
