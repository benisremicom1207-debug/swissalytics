import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { analyzeKeywords, getBrandVariants, getBrandPrincipal } from '../keywords';

/**
 * P9.1 — brand exclusion. Pre-fix, sites like sunrise.ch had "sunrise"
 * as the detected primary keyword (the brand name, repeated 75+ times),
 * which is useless for SEO targeting and triggered absurd "brand absent
 * du H1" alerts. These tests pin the new behavior:
 *   - hostname-derived words must be filtered from candidate keywords
 *   - the brand is still surfaced separately on placement.brand
 */

describe('getBrandVariants', () => {
  it('extracts the principal brand from a single-label hostname', () => {
    expect(getBrandVariants('https://sunrise.ch/')).toEqual(new Set(['sunrise']));
  });

  it('strips www. prefix', () => {
    expect(getBrandVariants('https://www.pixelab.ch/about')).toEqual(new Set(['pixelab']));
  });

  it('splits hyphenated labels and includes the de-hyphenated concat', () => {
    const v = getBrandVariants('https://pixelab-design.com/');
    expect(v.has('pixelab')).toBe(true);
    expect(v.has('design')).toBe(true);
    expect(v.has('pixelabdesign')).toBe(true);
  });

  it('drops parts shorter than 3 chars (e.g. "co" from example.co.uk)', () => {
    const v = getBrandVariants('https://example.co.uk/');
    expect(v.has('example')).toBe(true);
    expect(v.has('co')).toBe(false);
    expect(v.has('uk')).toBe(false);
  });

  it('returns empty set on missing or malformed URL', () => {
    expect(getBrandVariants(undefined)).toEqual(new Set());
    expect(getBrandVariants('not a url')).toEqual(new Set());
  });
});

describe('getBrandPrincipal', () => {
  it('returns the first hostname label', () => {
    expect(getBrandPrincipal('https://sunrise.ch/')).toBe('sunrise');
    expect(getBrandPrincipal('https://www.pixelab.ch/')).toBe('pixelab');
    expect(getBrandPrincipal('https://pixelab-design.com/')).toBe('pixelab-design');
  });

  it('returns undefined on missing or malformed URL', () => {
    expect(getBrandPrincipal(undefined)).toBeUndefined();
    expect(getBrandPrincipal('not a url')).toBeUndefined();
  });
});

describe('analyzeKeywords with brand exclusion', () => {
  // Minimal stub for testing — body has the brand name many times plus a
  // legitimate SEO keyword. Without P9.1 the brand would win on frequency.
  const html = `
    <html><head>
      <title>Sunrise — opérateur internet et mobile</title>
      <meta name="description" content="Sunrise, votre opérateur télécom suisse">
    </head><body>
      <h1>Sunrise</h1>
      <h2>Internet à très haut débit</h2>
      <p>Sunrise propose des abonnements internet et mobile. Sunrise vous accompagne.
      Avec Sunrise, profitez de l'internet fibre. Notre offre internet est rapide.
      L'internet partout, le mobile sans engagement, l'internet illimité.</p>
    </body></html>`;

  it('excludes the hostname brand from candidate keywords', () => {
    const $ = cheerio.load(html);
    const result = analyzeKeywords($, 'https://sunrise.ch/');
    const words = result.keywords.map((k) => k.word);
    expect(words).not.toContain('sunrise');
  });

  it('promotes a legitimate (internet-themed) keyword as primary, not the brand', () => {
    const $ = cheerio.load(html);
    const result = analyzeKeywords($, 'https://sunrise.ch/');
    expect(result.placement?.primary).not.toBe('sunrise');
    // After P9.2 (n-grams) the primary may be a single word ("internet") OR
    // a multi-word phrase ("internet mobile", "internet et mobile") — both
    // are valid SEO signals from this fixture. Pin only what we care about:
    // the brand is gone, and the top keyword is internet-themed.
    expect(result.placement?.primary).toMatch(/internet/);
  });

  it('still surfaces the brand on placement.brand for the UI', () => {
    const $ = cheerio.load(html);
    const result = analyzeKeywords($, 'https://sunrise.ch/');
    expect(result.placement?.brand).toBe('sunrise');
    // Body mentions "sunrise" 4 times in the fixture above
    expect(result.placement?.brandMentions).toBeGreaterThan(0);
  });

  it('does not exclude anything when no URL is passed (backward compat)', () => {
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    // Without URL, brand exclusion is inert and 'sunrise' wins on frequency
    expect(words).toContain('sunrise');
    expect(result.placement?.brand).toBeUndefined();
  });

  it('does not fire the "primary keyword absent du H1" issue on the brand anymore', () => {
    const $ = cheerio.load(html);
    const result = analyzeKeywords($, 'https://sunrise.ch/');
    const issueMsgs = result.issues.map((i) => i.message);
    expect(issueMsgs.some((m) => m.includes('« sunrise »'))).toBe(false);
  });
});

describe('Position weighting (P9.4)', () => {
  // Two keywords, each appears ONCE in different positions. Title/H1 weight
  // (10/8) should beat body weight (1) — pinning the section weights.
  const html = `
    <html><head>
      <title>Crypto trading platform</title>
      <meta name="description" content="The best place to trade.">
    </head><body>
      <h1>Crypto trading platform</h1>
      <p>Welcome. We have many words about cooking, baking, recipes,
      ingredients, kitchen, oven, cooking, cooking, cooking, cooking,
      cooking, cooking, cooking, cooking, cooking, cooking.</p>
    </body></html>`;

  it('title+H1 keywords outrank body-only keywords with equal raw frequency', () => {
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    // After P9.2 the trigram "crypto trading platform" wins (appears in
    // title+h1+meta with the trigram boost). Either way, the primary
    // should be crypto-themed, not body-themed (cooking).
    expect(result.placement?.primary).toMatch(/crypto/);
    expect(result.placement?.primary).not.toMatch(/cooking/);
  });

  it('body-only keywords still surface in the top 15', () => {
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    expect(words).toContain('cooking');
  });
});

describe('N-gram extraction (P9.2)', () => {
  it('surfaces bigrams alongside unigrams in the keyword list', () => {
    const html = `
      <html><head><title>Carte SIM mobile</title></head><body>
      <h1>Carte SIM mobile</h1>
      <p>Notre carte SIM est gratuite. La carte SIM mobile illimitée. Carte SIM Carte SIM.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    expect(words).toContain('carte sim');
  });

  it('rejects n-grams whose first or last token is a stop word', () => {
    const html = `
      <html><body>
      <p>très haut débit, à très haut, le mobile est rapide, sans engagement</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    // 'à très haut' starts with stop word 'à' → must be rejected
    expect(words).not.toContain('à très haut');
    // 'mobile est' ends with stop word 'est' → rejected
    expect(words).not.toContain('mobile est');
  });

  it('tolerates internal stop words in trigrams (so "carte de fidélité" works)', () => {
    const html = `
      <html><body>
      <p>Notre carte de fidélité est gratuite. La carte de fidélité offre des points.
      Programme carte de fidélité avec carte de fidélité numérique.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    // 'de' is internal — trigram should pass since 'carte' and 'fidélité' are candidates
    expect(words).toContain('carte de fidélité');
  });
});
