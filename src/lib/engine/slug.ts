/**
 * Permalink slug generation — human-readable, collision-resistant.
 *
 * Format: <hostname-slugified>-<4-char-suffix>
 * Examples:
 *   "https://pixelab.ch/about"        → "pixelab-ch-a8x4"
 *   "https://www.shop.example.com"    → "shop-example-com-x9k2"
 */

import { customAlphabet } from 'nanoid';

const suffixAlphabet = '23456789abcdefghijkmnpqrstuvwxyz';
const nanoSuffix = customAlphabet(suffixAlphabet, 4);

const HOSTNAME_MAX = 40;

export function newReportSlug(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  const body = hostname
    .replace(/[^a-z0-9.-]/g, '')   // strip non-allowed
    .replace(/\./g, '-')           // dots → dashes (consecutive dashes from
                                   // punycode like `xn--` are preserved by design)
    .replace(/^-|-$/g, '')         // trim leading/trailing dash
    .substring(0, HOSTNAME_MAX);
  return `${body}-${nanoSuffix()}`;
}
