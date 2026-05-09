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

  it('promotes the next-best legitimate keyword as primary', () => {
    const $ = cheerio.load(html);
    const result = analyzeKeywords($, 'https://sunrise.ch/');
    expect(result.placement?.primary).not.toBe('sunrise');
    // 'internet' is the legitimate top keyword in this fixture
    expect(result.placement?.primary).toBe('internet');
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
