import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { analyzeKeywords, getBrandVariants, getBrandPrincipal, selectTopTargets } from '../keywords';
import type { KeywordInfo } from '@/lib/types';

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

describe('Extended stopwords (P9.3)', () => {
  it('filters social network names that appear on most sites as footer noise', () => {
    const html = `
      <html><body>
      <p>Suivez-nous sur LinkedIn et Facebook. Notre page Twitter et Instagram.
      Rejoignez-nous sur YouTube et TikTok. WhatsApp Telegram Snapchat. Linkedin Facebook.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    expect(words).not.toContain('linkedin');
    expect(words).not.toContain('facebook');
    expect(words).not.toContain('twitter');
    expect(words).not.toContain('instagram');
  });

  it('filters CTA/nav generics (maintenant, voir, lire…)', () => {
    const html = `
      <html><body>
      <p>Acheter maintenant. Voir tous les produits. Lire la suite. Découvrir maintenant.
      Voir maintenant. Lire maintenant.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    expect(words).not.toContain('maintenant');
    expect(words).not.toContain('voir');
    expect(words).not.toContain('lire');
    expect(words).not.toContain('découvrir');
  });

  it('filters apostrophe artifacts (jusqu, aujourd, lorsqu split off elision)', () => {
    const html = `
      <html><body>
      <p>Jusqu'à 50% de réduction. Aujourd'hui seulement. Lorsqu'il arrive.
      Jusqu'au 31 décembre. Aujourd'hui spécial.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    expect(words).not.toContain('jusqu');
    expect(words).not.toContain('aujourd');
    expect(words).not.toContain('lorsqu');
  });

  it('filters German stop words (DE/CH-DE Swiss sites)', () => {
    const html = `
      <html lang="de"><body>
      <p>Die Internet-Verbindung ist schnell. Mit der Mobile-App und ohne Probleme.
      Wir bieten den Service für alle. Das ist die beste Lösung. Bei uns mit der.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    expect(words).not.toContain('und');
    expect(words).not.toContain('die');
    expect(words).not.toContain('mit');
    expect(words).not.toContain('das');
    expect(words).not.toContain('der');
  });

  // Pronoun coverage extended after go-mo.ch (DE telco) leaked 'dir'
  // ("you/yours" dative) as a top-3 keyword target. Pronouns are pure
  // grammar fillers and must never surface as SEO targets.

  it('filters DE personal pronouns (du/dich/dir/er/es) — regression for go-mo.ch', () => {
    const html = `
      <html lang="de"><body>
      <p>Du bekommst dein Abo. Dir gefällt es. Dich überzeugt der Preis. Du.
      Du Du Du dir dir dir dich dich dein dein. Er kommt. Es ist da. Sie auch.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    for (const w of ['du', 'dich', 'dir', 'dein', 'er', 'es', 'sie']) {
      expect(words, `'${w}' should be filtered`).not.toContain(w);
    }
  });

  it('filters FR personal pronouns (je/tu/te/moi/toi/eux)', () => {
    const html = `
      <html lang="fr"><body>
      <p>Je découvre. Tu choisis. Te plaire. Moi je préfère. Toi aussi.
      Eux aussi. Je je je tu tu tu moi moi toi toi te te eux eux.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    for (const w of ['je', 'tu', 'te', 'moi', 'toi', 'eux']) {
      expect(words, `'${w}' should be filtered`).not.toContain(w);
    }
  });

  it('filters EN reflexives + absolute possessives (yours/myself/themselves)', () => {
    const html = `
      <html lang="en"><body>
      <p>This is yours. The choice is mine. Hers is here. Ours too. Theirs.
      Myself yourself himself herself itself ourselves themselves.
      yours yours yours mine mine mine myself myself themselves themselves.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    for (const w of ['yours', 'mine', 'hers', 'ours', 'theirs', 'myself', 'yourself', 'themselves']) {
      expect(words, `'${w}' should be filtered`).not.toContain(w);
    }
  });

  it('filters IT articles + pronouns + prepositions (4ᵉ langue officielle CH)', () => {
    const html = `
      <html lang="it"><body>
      <p>Il prodotto è ottimo. La nostra offerta. Lo scopri. Gli amici.
      Io tu lui lei noi voi loro. Mi ti ci vi si.
      Di da in con su per. Del della dei delle. Questo questa quello quella.
      Il il il la la la lo lo lo gli gli io io io lui lui lei lei.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    for (const w of [
      'il', 'la', 'lo', 'gli', 'le',
      'io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro',
      'di', 'da', 'in', 'su', 'per',
      'del', 'della', 'dei', 'delle',
      'questo', 'questa', 'quello', 'quella',
    ]) {
      expect(words, `'${w}' should be filtered`).not.toContain(w);
    }
  });

  it('filters IT auxiliaries + adverbs (è/sono/molto/sempre)', () => {
    const html = `
      <html lang="it"><body>
      <p>È buono. Sono qui. Hai capito. Hanno deciso. Molto bene. Sempre presente.
      è è è sono sono sono molto molto sempre sempre tutto tutto tutto tutti tutti.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    for (const w of ['è', 'sono', 'hai', 'hanno', 'molto', 'sempre', 'tutto', 'tutti']) {
      expect(words, `'${w}' should be filtered`).not.toContain(w);
    }
  });

  it('does NOT filter geography (could be a legit travel/local keyword)', () => {
    const html = `
      <html><head><title>Voyages en Suisse</title></head><body>
      <h1>Voyages en Suisse</h1>
      <p>Découvrez la Suisse. Visiter la Suisse. Voyage Suisse organisé.
      La Suisse, ses montagnes, ses lacs. Suisse Suisse Suisse.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    const words = result.keywords.map((k) => k.word);
    // 'suisse' is a legit keyword for a travel site — must NOT be filtered
    expect(words).toContain('suisse');
  });
});

describe('selectTopTargets — multi-keyword dedup (P13)', () => {
  // Real-world salt.ch top-12 (from smoke test)
  const saltKeywords: KeywordInfo[] = [
    { word: 'internet', count: 67 },
    { word: 'mobile', count: 45 },
    { word: 'order', count: 29 },
    { word: 'unlimited calls', count: 27 },
    { word: 'unlimited', count: 25 },
    { word: 'free', count: 25 },
    { word: 'mobile subscription', count: 24 },
    { word: 'islands', count: 24 },
    { word: 'including', count: 24 },
    { word: 'internet at maximum', count: 24 },
    { word: 'unlimited calls sms', count: 24 },
    { word: 'subscription', count: 22 },
  ];

  it('returns the top N candidates when no overlaps exist', () => {
    const out = selectTopTargets(saltKeywords, 3);
    expect(out).toHaveLength(3);
    expect(out.map((k) => k.word)).toEqual(['internet', 'mobile', 'order']);
  });

  it('skips n-gram variants that share a word with an already-selected target', () => {
    const out = selectTopTargets(saltKeywords, 3);
    const words = out.map((k) => k.word);
    // "internet at maximum" and "mobile subscription" must NOT appear —
    // they overlap with "internet" and "mobile" respectively.
    expect(words).not.toContain('internet at maximum');
    expect(words).not.toContain('mobile subscription');
    expect(words).not.toContain('unlimited calls sms');
  });

  it('returns fewer than N when not enough distinct themes exist', () => {
    const onlyOneTheme: KeywordInfo[] = [
      { word: 'internet', count: 50 },
      { word: 'internet mobile', count: 40 },
      { word: 'internet at home', count: 30 },
    ];
    const out = selectTopTargets(onlyOneTheme, 3);
    expect(out).toHaveLength(1);
    expect(out[0].word).toBe('internet');
  });

  it('returns empty array when input is empty', () => {
    expect(selectTopTargets([], 3)).toEqual([]);
  });

  it('respects the n parameter (e.g. n=5 surfaces 5 distinct themes if available)', () => {
    const out = selectTopTargets(saltKeywords, 5);
    expect(out.length).toBeGreaterThanOrEqual(3);
    // Each pair of selected entries must share zero words
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const wordsA = new Set(out[i].word.split(' '));
        const wordsB = out[j].word.split(' ');
        expect(wordsB.some((w) => wordsA.has(w))).toBe(false);
      }
    }
  });
});

describe('analyzeKeywords integration with targets', () => {
  it('exposes targets[] alongside placement, with primary as targets[0]', () => {
    const html = `
      <html><head><title>Internet et mobile</title></head><body>
      <h1>Internet et mobile</h1>
      <p>Notre offre internet et mobile. L'internet rapide. Le mobile illimité.
      Carte SIM gratuite. Carte SIM pour tous.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    expect(result.targets).toBeDefined();
    expect(result.targets.length).toBeGreaterThan(0);
    expect(result.targets[0].word).toBe(result.placement?.primary);
  });

  it('returns targets: [] when no keywords detected', () => {
    const $ = cheerio.load('<html><body></body></html>');
    const result = analyzeKeywords($);
    expect(result.targets).toEqual([]);
  });

  it('each target carries its own placement check', () => {
    const html = `
      <html><head>
        <title>Internet et mobile illimité</title>
        <meta name="description" content="Mobile illimité chez nous">
      </head><body>
      <h1>Internet et mobile illimité</h1>
      <p>Notre internet est rapide. Le mobile illimité partout. Carte SIM. Sim gratuite.
      Internet partout. Mobile partout. Carte SIM partout.</p>
      </body></html>`;
    const $ = cheerio.load(html);
    const result = analyzeKeywords($);
    // Each target should have inTitle/inH1/inMeta/inFirst100 booleans
    for (const t of result.targets) {
      expect(typeof t.inTitle).toBe('boolean');
      expect(typeof t.inH1).toBe('boolean');
      expect(typeof t.inMetaDescription).toBe('boolean');
      expect(typeof t.inFirst100Words).toBe('boolean');
      expect(typeof t.score).toBe('number');
    }
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
