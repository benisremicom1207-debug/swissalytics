import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { detectCMS } from '../technical';

/**
 * detectCMS — pin the Magento detection so the loose `mage-` substring
 * (which matched obfuscated Vue/React class names like
 * `mage-container__TvwTI` on sunrise.ch) doesn't regress.
 */

function load(html: string) {
  return { $: cheerio.load(html), html };
}

describe('detectCMS — Magento detection (regression for sunrise.ch)', () => {
  it('does NOT flag Magento on Vue/React obfuscated class names with mage- prefix', () => {
    const { $, html } = load(`
      <html><body>
        <div class="mage-container__TvwTI">Vue component</div>
        <div class="mage-grid__xVgCy">Another</div>
      </body></html>
    `);
    expect(detectCMS($, html)).not.toBe('Magento');
  });

  it('flags Magento via data-mage-init attribute', () => {
    const { $, html } = load(`<html><body><div data-mage-init='{"foo":{}}'></div></body></html>`);
    expect(detectCMS($, html)).toBe('Magento');
  });

  it('flags Magento via Mage_Catalog legacy class', () => {
    const { $, html } = load(`<html><body><script>require(['Mage_Catalog/js/list']);</script></body></html>`);
    expect(detectCMS($, html)).toBe('Magento');
  });

  it('flags Magento via /static/version/frontend/Magento path', () => {
    const { $, html } = load(`<html><body><script src="/static/version/frontend/Magento/luma/en_US/foo.js"></script></body></html>`);
    expect(detectCMS($, html)).toBe('Magento');
  });

  it('flags Magento via generator meta tag', () => {
    const { $, html } = load(`<html><head><meta name="generator" content="Magento 2.4.6"/></head><body></body></html>`);
    expect(detectCMS($, html)).toBe('Magento');
  });
});

describe('detectCMS — non-Magento sites stay untouched', () => {
  it('returns null for a plain HTML page', () => {
    const { $, html } = load(`<html><body><h1>Plain page</h1></body></html>`);
    expect(detectCMS($, html)).toBeNull();
  });

  it('detects WordPress over Magento when both substrings present', () => {
    const { $, html } = load(`<html><body><link href="/wp-content/themes/x.css"/></body></html>`);
    expect(detectCMS($, html)).toBe('WordPress');
  });
});
