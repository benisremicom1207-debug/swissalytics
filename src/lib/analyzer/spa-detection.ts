/**
 * SPA shell detection — flags pages whose static HTML is essentially empty
 * because the real content is JavaScript-rendered.
 *
 * Why this matters for a GEO/AI analyzer:
 *   - Googlebot has run a Chromium engine since 2019 → it WILL eventually
 *     see JS-rendered content (in a "second wave" indexing pass).
 *   - But AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Common Crawl)
 *     do NOT execute JavaScript — they read the static HTML only.
 *   - A SPA shell with `<h1>` injected at runtime therefore renders as
 *     "no headings, ~empty body" to every AI engine that scrapes it.
 *
 * Our analyzer uses cheerio (HTML parser, no JS execution), so it sees
 * exactly what AI engines see. When the static HTML is shell-only, the
 * "no H1 / no content" findings are TECHNICALLY CORRECT but the user
 * needs the context: the recommendation isn't "add a heading" but
 * "render server-side or pre-render so AI engines can read the page".
 *
 * Detection is intentionally conservative — we only flag a shell when
 * BOTH headingCount === 0 AND bodyWordCount < 200 (or a known SPA
 * framework signature is present). False positives here would scare
 * users about pages that are actually fine for AI crawling.
 */

import type { CheerioAPI } from 'cheerio';

/**
 * Page-shape verdict driving the contextual warning banner:
 *   - 'spa-shell'   : no headings AND thin body (true JS-rendered shell)
 *   - 'styled-divs' : no headings BUT real body content (semantic-HTML
 *                     failure — devs used `<div class="font-bold">` etc.
 *                     instead of `<h1>`/`<h2>`; AI engines see content but
 *                     can't infer hierarchy)
 *   - 'normal'      : at least one heading present (no banner shown)
 */
export type SpaVerdict = 'spa-shell' | 'styled-divs' | 'normal';

export interface SpaDetection {
  /** Tri-state verdict — drives the banner kind in the UI. */
  verdict: SpaVerdict;
  /**
   * Convenience boolean kept for back-compat with consumers that only
   * cared about the SPA-shell case. Equivalent to `verdict === 'spa-shell'`.
   */
  isSpaShell: boolean;
  /** Total <h1>..<h6> tags found in the static HTML. */
  headingCount: number;
  /** Number of <script src> tags (external scripts). */
  scriptCount: number;
  /** Approximate visible body word count (scripts/styles/noscript stripped). */
  bodyWordCount: number;
  /** True when a known SPA-framework signature is detected in the raw HTML. */
  hasSpaSignature: boolean;
  /** Human-readable indicator strings (used by UI to explain the verdict). */
  indicators: string[];
}

/**
 * Patterns that mean "this site is built with a SPA framework". Detection
 * via raw HTML string (not cheerio) because some appear as comments or
 * inside script bodies.
 */
const SPA_SIGNATURES: Array<{ re: RegExp; label: string }> = [
  { re: /__NEXT_DATA__/, label: 'Next.js' },
  { re: /__NUXT__|window\.__NUXT__/, label: 'Nuxt.js' },
  { re: /\bdata-reactroot\b|\bdata-react-/, label: 'React' },
  { re: /\bng-app\b|\bng-version\b/, label: 'Angular' },
  { re: /\bv-app\b|\bdata-vue\b/, label: 'Vue.js' },
  { re: /\bsveltekit:|<svelte:/, label: 'SvelteKit' },
  { re: /\bhydrate-/, label: 'SPA hydration' },
];

export function detectSpa($: CheerioAPI, html: string): SpaDetection {
  const headingCount = $('h1, h2, h3, h4, h5, h6').length;
  const scriptCount = $('script[src]').length;

  // Strip script/style/noscript before counting words — noscript fallback
  // text shouldn't inflate the body count or it would mask a true shell.
  const $body = $('body').clone();
  $body.find('script, style, noscript, template').remove();
  const bodyText = $body.text().replace(/\s+/g, ' ').trim();
  const bodyWordCount = bodyText ? bodyText.split(' ').filter(Boolean).length : 0;

  const matchedSig = SPA_SIGNATURES.find((s) => s.re.test(html));
  const hasSpaSignature = !!matchedSig;

  const indicators: string[] = [];
  if (headingCount === 0) indicators.push('Aucune balise H1–H6 dans le HTML statique');
  if (bodyWordCount < 200) indicators.push(`Body très léger (${bodyWordCount} mots visibles)`);
  if (scriptCount > 8) indicators.push(`${scriptCount} scripts externes`);
  if (matchedSig) indicators.push(`Signature framework SPA : ${matchedSig.label}`);

  // Verdict resolution:
  //   - shell-only   : no headings AND thin body → JS-rendered shell
  //   - styled-divs  : no headings BUT real body content → semantic-HTML
  //                    failure (devs used styled <div>/<p> instead of
  //                    <h1>/<h2>; common on themed CMS templates)
  //   - normal       : has at least one heading → no banner
  let verdict: SpaVerdict = 'normal';
  if (headingCount === 0) {
    verdict = bodyWordCount < 200 ? 'spa-shell' : 'styled-divs';
  }

  return {
    verdict,
    isSpaShell: verdict === 'spa-shell',
    headingCount,
    scriptCount,
    bodyWordCount,
    hasSpaSignature,
    indicators,
  };
}
