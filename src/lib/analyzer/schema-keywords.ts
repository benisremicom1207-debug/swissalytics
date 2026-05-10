/**
 * Schema.org-first keyword extraction (P14.A).
 *
 * Statistical keyword extraction is descriptive ("what's on the page")
 * but tells us nothing about INTENT. When a site has Schema.org
 * markup, the markup IS the canonical declaration of "what this page
 * is about" — much stronger signal than n-gram frequency.
 *
 * This module pulls semantic keywords out of Service / Product /
 * Article / Organization / WebSite / LocalBusiness JSON-LD blocks
 * (the schemas Wingo / Salt / Sunrise et al. typically expose).
 *
 * The output is consumed by the UI to surface a "Keywords announced
 * by the site itself" chip group above the statistical extraction —
 * shows the user the AUTHOR's stated focus separately from the
 * empirical word frequency.
 */

import type { CheerioAPI } from './cheerio';

export interface SchemaKeywords {
  /** Whether any meaningful schema-derived signal was extracted. */
  found: boolean;
  /** Service.name / Product.name / Article.headline / WebSite.name. */
  canonicalName?: string;
  /** Service.description / Product.description / Article.description. */
  canonicalDescription?: string;
  /** Service.serviceType / Product.category / Article.about. */
  category?: string;
  /** Article/WebSite/Product `keywords` field (split by comma). */
  keywords: string[];
  /** Product.brand.name / Service.provider.name. */
  brand?: string;
  /** Schema types from which signals were drawn (debug/UI hint). */
  sourceTypes: string[];
}

/**
 * Schemas we consider "keyword-bearing". Order matters — the first
 * match wins for canonicalName/description (Service over WebSite).
 */
const KEYWORD_BEARING = [
  'Service',
  'Product',
  'Article',
  'NewsArticle',
  'BlogPosting',
  'LocalBusiness',
  'Restaurant',
  'Store',
  'Organization',
  'WebSite',
] as const;

type KeywordBearingType = typeof KEYWORD_BEARING[number];

interface SchemaItem {
  ['@type']?: string | string[];
  name?: string;
  headline?: string;
  description?: string;
  category?: string;
  serviceType?: string;
  about?: string;
  keywords?: string | string[];
  brand?: { name?: string } | string;
  provider?: { name?: string } | string;
  [key: string]: unknown;
}

/** Walk a JSON-LD payload and yield every concrete @type-bearing item. */
function* walkSchemaItems(payload: unknown): Generator<SchemaItem> {
  if (!payload) return;
  if (Array.isArray(payload)) {
    for (const item of payload) yield* walkSchemaItems(item);
    return;
  }
  if (typeof payload !== 'object') return;
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj['@graph'])) {
    for (const item of obj['@graph']) yield* walkSchemaItems(item);
  }
  if (obj['@type']) {
    yield obj as SchemaItem;
  }
}

function getTypes(item: SchemaItem): string[] {
  const t = item['@type'];
  if (!t) return [];
  return Array.isArray(t) ? t.map(String) : [String(t)];
}

function isKeywordBearing(types: string[]): KeywordBearingType | null {
  for (const wanted of KEYWORD_BEARING) {
    if (types.includes(wanted)) return wanted;
  }
  return null;
}

function readKeywords(item: SchemaItem): string[] {
  const k = item.keywords;
  if (!k) return [];
  if (Array.isArray(k)) return k.map(String).map((s) => s.trim()).filter(Boolean);
  return String(k)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function readBrand(item: SchemaItem): string | undefined {
  if (!item.brand) return undefined;
  if (typeof item.brand === 'string') return item.brand;
  if (typeof item.brand === 'object' && item.brand?.name) return String(item.brand.name);
  return undefined;
}

function readProvider(item: SchemaItem): string | undefined {
  if (!item.provider) return undefined;
  if (typeof item.provider === 'string') return item.provider;
  if (typeof item.provider === 'object' && item.provider?.name) return String(item.provider.name);
  return undefined;
}

/**
 * Parse all <script type="application/ld+json"> blocks and extract
 * keyword-bearing signals. Returns `{ found: false, ... }` when no
 * relevant schema was detected — caller should then fall back to the
 * statistical extractor.
 */
export function extractSchemaKeywords($: CheerioAPI): SchemaKeywords {
  const result: SchemaKeywords = {
    found: false,
    keywords: [],
    sourceTypes: [],
  };

  const seenTypes = new Set<string>();

  $('script[type="application/ld+json"]').each((_, el) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse($(el).html() || '');
    } catch {
      return; // skip malformed JSON-LD
    }

    for (const item of walkSchemaItems(parsed)) {
      const types = getTypes(item);
      const bearing = isKeywordBearing(types);
      if (!bearing) continue;

      // Track the source for the UI hint — list each bearing type once.
      for (const t of types) {
        if ((KEYWORD_BEARING as readonly string[]).includes(t)) {
          seenTypes.add(t);
        }
      }

      // First-match wins for canonicalName/description (priority via
      // KEYWORD_BEARING order). Don't overwrite once set.
      if (!result.canonicalName) {
        const name = item.name || item.headline;
        if (name && typeof name === 'string') result.canonicalName = name.trim();
      }
      if (!result.canonicalDescription) {
        if (item.description && typeof item.description === 'string') {
          result.canonicalDescription = item.description.trim();
        }
      }
      if (!result.category) {
        const cat = item.serviceType || item.category || item.about;
        if (cat && typeof cat === 'string') result.category = cat.trim();
      }
      if (!result.brand) {
        result.brand = readBrand(item) || readProvider(item);
      }
      // Always merge the keywords field across items (union).
      for (const kw of readKeywords(item)) {
        if (!result.keywords.includes(kw)) result.keywords.push(kw);
      }
    }
  });

  result.sourceTypes = [...seenTypes];
  result.found =
    !!result.canonicalName ||
    !!result.canonicalDescription ||
    !!result.category ||
    result.keywords.length > 0;

  return result;
}
