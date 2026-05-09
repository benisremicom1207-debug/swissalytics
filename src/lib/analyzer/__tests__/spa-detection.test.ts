import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { detectSpa } from '../spa-detection';

/**
 * detectSpa — pin the tri-state verdict so we cover both true SPA shells
 * (no headings + no content) AND semantic-HTML failures like go-mo.ch
 * (real content, but devs used styled <div> instead of <h1>/<h2>).
 *
 * Rules:
 *   - 'spa-shell'   : headingCount === 0 && bodyWordCount < 200
 *   - 'styled-divs' : headingCount === 0 && bodyWordCount >= 200
 *   - 'normal'      : headingCount > 0
 */

function load(html: string) {
  const $ = cheerio.load(html);
  return { $, html };
}

describe('detectSpa — shell case (true positives)', () => {
  it('flags a typical empty SPA shell (no headings + thin body)', () => {
    const { $, html } = load(`
      <html><head><title>App</title></head>
      <body>
        <div id="root"></div>
        <script src="/app.js"></script>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.verdict).toBe('spa-shell');
    expect(result.isSpaShell).toBe(true);
    expect(result.headingCount).toBe(0);
    expect(result.bodyWordCount).toBeLessThan(200);
  });

  it('flags a Next.js SPA shell with __NEXT_DATA__ but no SSR content', () => {
    const { $, html } = load(`
      <html><head><title>Site</title></head>
      <body>
        <div id="__next"></div>
        <script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.isSpaShell).toBe(true);
    expect(result.hasSpaSignature).toBe(true);
    expect(result.indicators.some((i) => i.includes('Next.js'))).toBe(true);
  });

  it('flags a JS-rendered shell that has noscript fallback (noscript stripped from word count)', () => {
    const { $, html } = load(`
      <html><body>
        <div id="app"></div>
        <noscript>This site requires JavaScript. Please enable it to continue. ${'word '.repeat(300)}</noscript>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.isSpaShell).toBe(true);
    expect(result.bodyWordCount).toBeLessThan(50);
  });
});

describe('detectSpa — SSR case (true negatives)', () => {
  it('does NOT flag a normal SSR page with H1 + content', () => {
    const { $, html } = load(`
      <html><body>
        <h1>Real heading</h1>
        <p>${'lorem ipsum dolor sit amet '.repeat(60)}</p>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.verdict).toBe('normal');
    expect(result.isSpaShell).toBe(false);
    expect(result.headingCount).toBe(1);
    expect(result.bodyWordCount).toBeGreaterThan(200);
  });

  it('does NOT flag a SSR Next.js page (has __NEXT_DATA__ AND headings)', () => {
    const { $, html } = load(`
      <html><body>
        <h1>Server-rendered title</h1>
        <h2>Section</h2>
        <p>${'real content '.repeat(120)}</p>
        <script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.isSpaShell).toBe(false);
    expect(result.hasSpaSignature).toBe(true);
  });

  it('does NOT flag a thin landing page that has at least one heading', () => {
    // Landing page with single hero — < 200 words but has H1, NOT a shell.
    const { $, html } = load(`
      <html><body>
        <h1>Welcome</h1>
        <p>Short tagline.</p>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.isSpaShell).toBe(false);
  });

  it('does NOT flag a thick page with no H1 (rare, but should not trigger)', () => {
    // Page has H2/H3 but no H1, with lots of content — still SSR.
    const { $, html } = load(`
      <html><body>
        <h2>Section</h2>
        <p>${'content content '.repeat(200)}</p>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.isSpaShell).toBe(false);
    expect(result.headingCount).toBe(1);
  });
});

describe('detectSpa — styled-divs case (semantic-HTML failure)', () => {
  it('flags as styled-divs when content is rich but headings are 0', () => {
    // Mimics go-mo.ch: real body text in <p>/<div class="font-bold"> but
    // zero <h1>/<h2>/<h3> tags. Content is visible to AI engines, the
    // problem is hierarchy.
    const { $, html } = load(`
      <html><body>
        <div class="font-bold text-lg">Visual title (should be h1)</div>
        <p>${'real content paragraph '.repeat(80)}</p>
        <div class="font-bold">Another visual title</div>
        <p>${'more content '.repeat(40)}</p>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.verdict).toBe('styled-divs');
    expect(result.isSpaShell).toBe(false); // not a shell — content IS there
    expect(result.headingCount).toBe(0);
    expect(result.bodyWordCount).toBeGreaterThanOrEqual(200);
  });

  it('keeps styled-divs verdict even with many scripts (not SPA shell)', () => {
    const scripts = Array.from({ length: 12 }, (_, i) => `<script src="/${i}.js"></script>`).join('');
    const { $, html } = load(`
      <html><body>
        <p>${'lots of content '.repeat(100)}</p>
        ${scripts}
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.verdict).toBe('styled-divs');
  });
});

describe('detectSpa — indicators', () => {
  it('lists "Aucune balise H1–H6" when headingCount === 0', () => {
    const { $, html } = load('<html><body><div></div></body></html>');
    const result = detectSpa($, html);
    expect(result.indicators).toContain('Aucune balise H1–H6 dans le HTML statique');
  });

  it('lists script-count indicator when > 8 external scripts', () => {
    const scripts = Array.from({ length: 10 }, (_, i) => `<script src="/${i}.js"></script>`).join('');
    const { $, html } = load(`<html><body><h1>x</h1><p>${'word '.repeat(300)}</p>${scripts}</body></html>`);
    const result = detectSpa($, html);
    expect(result.scriptCount).toBe(10);
    expect(result.indicators.some((i) => i.includes('10 scripts externes'))).toBe(true);
  });

  it('detects Vue.js signature without flagging as shell when content present', () => {
    const { $, html } = load(`
      <html><body data-vue>
        <h1>Real H1</h1>
        <p>${'content '.repeat(120)}</p>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.hasSpaSignature).toBe(true);
    expect(result.isSpaShell).toBe(false);
  });
});

describe('detectSpa — edge cases', () => {
  it('handles empty HTML safely', () => {
    const { $, html } = load('');
    const result = detectSpa($, html);
    expect(result.isSpaShell).toBe(true); // 0 headings + 0 words → shell
    expect(result.bodyWordCount).toBe(0);
  });

  it('strips <template> contents from body word count', () => {
    const { $, html } = load(`
      <html><body>
        <div id="app"></div>
        <template>${'inert '.repeat(300)}</template>
      </body></html>
    `);
    const result = detectSpa($, html);
    expect(result.bodyWordCount).toBeLessThan(50);
    expect(result.isSpaShell).toBe(true);
  });
});
