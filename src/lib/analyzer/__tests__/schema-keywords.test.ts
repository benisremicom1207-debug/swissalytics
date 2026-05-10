import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { extractSchemaKeywords } from '../schema-keywords';

function load(jsonLd: unknown | unknown[]): cheerio.CheerioAPI {
  const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  const scripts = blocks
    .map((b) => `<script type="application/ld+json">${JSON.stringify(b)}</script>`)
    .join('');
  return cheerio.load(`<html><body>${scripts}</body></html>`);
}

describe('extractSchemaKeywords — found cases', () => {
  it('extracts canonical name + description from a Service schema', () => {
    const $ = load({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Abonnement internet fibre suisse',
      description: 'Internet illimité dès 39.95/mois en Suisse',
      serviceType: 'Internet & Mobile',
    });
    const result = extractSchemaKeywords($);
    expect(result.found).toBe(true);
    expect(result.canonicalName).toBe('Abonnement internet fibre suisse');
    expect(result.canonicalDescription).toBe('Internet illimité dès 39.95/mois en Suisse');
    expect(result.category).toBe('Internet & Mobile');
    expect(result.sourceTypes).toContain('Service');
  });

  it('extracts brand from Product schema', () => {
    const $ = load({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'iPhone 15 Pro',
      brand: { '@type': 'Brand', name: 'Apple' },
      category: 'Smartphone',
    });
    const result = extractSchemaKeywords($);
    expect(result.canonicalName).toBe('iPhone 15 Pro');
    expect(result.brand).toBe('Apple');
    expect(result.category).toBe('Smartphone');
  });

  it('extracts brand from Service.provider', () => {
    const $ = load({
      '@type': 'Service',
      name: 'Forfait mobile',
      provider: { '@type': 'Organization', name: 'Wingo' },
    });
    expect(extractSchemaKeywords($).brand).toBe('Wingo');
  });

  it('handles brand as plain string', () => {
    const $ = load({ '@type': 'Product', name: 'X', brand: 'AcmeCo' });
    expect(extractSchemaKeywords($).brand).toBe('AcmeCo');
  });

  it('extracts comma-separated keywords field', () => {
    const $ = load({
      '@type': 'Article',
      headline: 'SEO 2026',
      keywords: 'SEO, GEO, AI search, ChatGPT, Perplexity',
    });
    const result = extractSchemaKeywords($);
    expect(result.canonicalName).toBe('SEO 2026'); // headline used when name missing
    expect(result.keywords).toEqual(['SEO', 'GEO', 'AI search', 'ChatGPT', 'Perplexity']);
  });

  it('extracts array-form keywords', () => {
    const $ = load({
      '@type': 'WebSite',
      name: 'Swissalytics',
      keywords: ['SEO', 'GEO', 'analyseur'],
    });
    expect(extractSchemaKeywords($).keywords).toEqual(['SEO', 'GEO', 'analyseur']);
  });

  it('walks @graph-wrapped payloads', () => {
    const $ = load({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', name: 'Wingo' },
        { '@type': 'Service', name: 'Internet fibre', serviceType: 'Telecom' },
      ],
    });
    const result = extractSchemaKeywords($);
    expect(result.found).toBe(true);
    // Service has higher priority in KEYWORD_BEARING order so its name wins,
    // but Organization comes earlier in the @graph array — first match wins.
    expect(result.canonicalName).toBe('Wingo');
    expect(result.sourceTypes).toContain('Service');
    expect(result.sourceTypes).toContain('Organization');
  });

  it('handles array of independent JSON-LD blocks', () => {
    const $ = load([
      { '@type': 'Organization', name: 'Acme' },
      { '@type': 'WebSite', name: 'Acme Site', keywords: 'a, b' },
    ]);
    const result = extractSchemaKeywords($);
    expect(result.canonicalName).toBe('Acme');
    expect(result.keywords).toEqual(['a', 'b']);
  });

  it('handles multiple <script> blocks (real-world layout)', () => {
    const $ = cheerio.load(`
      <html><body>
        <script type="application/ld+json">${JSON.stringify({ '@type': 'Organization', name: 'Wingo' })}</script>
        <script type="application/ld+json">${JSON.stringify({ '@type': 'Service', name: 'Mobile', serviceType: 'Telco' })}</script>
      </body></html>
    `);
    const result = extractSchemaKeywords($);
    expect(result.found).toBe(true);
    expect(result.canonicalName).toBe('Wingo'); // first wins
    expect(result.category).toBe('Telco');
  });
});

describe('extractSchemaKeywords — not-found / edge cases', () => {
  it('returns found=false when no <script ld+json> at all', () => {
    const $ = cheerio.load('<html><body><h1>Plain page</h1></body></html>');
    const result = extractSchemaKeywords($);
    expect(result.found).toBe(false);
    expect(result.keywords).toEqual([]);
    expect(result.sourceTypes).toEqual([]);
  });

  it('skips malformed JSON-LD without throwing', () => {
    const $ = cheerio.load(`
      <html><body>
        <script type="application/ld+json">NOT JSON</script>
      </body></html>
    `);
    expect(() => extractSchemaKeywords($)).not.toThrow();
    expect(extractSchemaKeywords($).found).toBe(false);
  });

  it('ignores non-keyword-bearing schemas (BreadcrumbList alone)', () => {
    const $ = load({
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', name: 'Home' }],
    });
    expect(extractSchemaKeywords($).found).toBe(false);
  });

  it('mixes one keyword-bearing + several breadcrumbs cleanly', () => {
    const $ = load([
      { '@type': 'BreadcrumbList', itemListElement: [] },
      { '@type': 'Article', headline: 'Title', description: 'Desc' },
      { '@type': 'BreadcrumbList', itemListElement: [] },
    ]);
    const result = extractSchemaKeywords($);
    expect(result.found).toBe(true);
    expect(result.canonicalName).toBe('Title');
    expect(result.sourceTypes).toEqual(['Article']);
  });

  it('trims whitespace on extracted strings', () => {
    const $ = load({
      '@type': 'Product',
      name: '  iPhone  ',
      description: '  Great phone  ',
    });
    const result = extractSchemaKeywords($);
    expect(result.canonicalName).toBe('iPhone');
    expect(result.canonicalDescription).toBe('Great phone');
  });

  it('handles array @type (e.g. ["Service","LocalBusiness"])', () => {
    const $ = load({
      '@type': ['Service', 'LocalBusiness'],
      name: 'Restaurant fibre',
      serviceType: 'Internet pro',
    });
    const result = extractSchemaKeywords($);
    expect(result.found).toBe(true);
    expect(result.canonicalName).toBe('Restaurant fibre');
    expect(result.sourceTypes).toContain('Service');
    expect(result.sourceTypes).toContain('LocalBusiness');
  });
});
