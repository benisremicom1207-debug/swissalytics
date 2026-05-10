import { describe, it, expect } from 'vitest';
import { groupLinksByHref } from '../dedup-links';
import type { LinkInfo } from '@/lib/types';

function link(over: Partial<LinkInfo> & { href: string }): LinkInfo {
  return {
    href: over.href,
    text: over.text ?? '',
    isNofollow: over.isNofollow ?? false,
    isSponsored: over.isSponsored ?? false,
    isUgc: over.isUgc ?? false,
    isExternal: over.isExternal ?? false,
  };
}

describe('groupLinksByHref', () => {
  it('returns empty array for empty input', () => {
    expect(groupLinksByHref([])).toEqual([]);
  });

  it('passes single occurrence through with count=1', () => {
    const result = groupLinksByHref([link({ href: '/about', text: 'About us' })]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      href: '/about',
      texts: ['About us'],
      count: 1,
      isNofollow: false,
      isSponsored: false,
      isUgc: false,
    });
  });

  it('groups duplicate hrefs and bumps count', () => {
    const result = groupLinksByHref([
      link({ href: '/services', text: 'Services' }),
      link({ href: '/services', text: 'Services' }),
      link({ href: '/services', text: 'Services' }),
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].count).toBe(3);
  });

  it('collects unique non-empty anchor texts in order seen', () => {
    const result = groupLinksByHref([
      link({ href: '/contact', text: 'Contact' }),       // header
      link({ href: '/contact', text: 'Nous contacter' }), // body CTA
      link({ href: '/contact', text: '' }),                // footer icon-only
      link({ href: '/contact', text: 'Contact' }),         // footer dup
    ]);
    expect(result[0].texts).toEqual(['Contact', 'Nous contacter']);
    expect(result[0].count).toBe(4);
  });

  it('preserves insertion order across distinct hrefs', () => {
    const result = groupLinksByHref([
      link({ href: '/a' }),
      link({ href: '/b' }),
      link({ href: '/a' }),
      link({ href: '/c' }),
    ]);
    expect(result.map((d) => d.href)).toEqual(['/a', '/b', '/c']);
  });

  it('OR-merges nofollow attribute across occurrences (pessimistic)', () => {
    // First occurrence is dofollow, second is nofollow → result must be nofollow.
    const result = groupLinksByHref([
      link({ href: '/x', isNofollow: false }),
      link({ href: '/x', isNofollow: true }),
    ]);
    expect(result[0].isNofollow).toBe(true);
  });

  it('OR-merges sponsored + ugc attributes independently', () => {
    const result = groupLinksByHref([
      link({ href: '/x', isSponsored: false, isUgc: true }),
      link({ href: '/x', isSponsored: true,  isUgc: false }),
    ]);
    expect(result[0].isSponsored).toBe(true);
    expect(result[0].isUgc).toBe(true);
  });

  it('keeps href differentiation (trailing slash matters)', () => {
    // We do NOT canonicalize — different strings = different rows.
    // Backend already normalizes; UI just trusts what it gets.
    const result = groupLinksByHref([
      link({ href: '/services' }),
      link({ href: '/services/' }),
    ]);
    expect(result).toHaveLength(2);
  });

  it('handles a typical sunrise-shaped fixture (header + footer dup)', () => {
    // Mimics what we see on telco homepages: nav bar + breadcrumb +
    // footer all link to /aide.html with different anchor texts.
    const result = groupLinksByHref([
      link({ href: '/aide', text: 'Aide' }),               // header nav
      link({ href: '/aide', text: 'Centre d\'aide' }),     // CTA card
      link({ href: '/aide', text: 'Aide' }),               // footer
      link({ href: '/aide', text: '' }),                    // icon-only mobile
      link({ href: '/contact', text: 'Contact' }),
      link({ href: '/contact', text: 'Contact' }),
    ]);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ href: '/aide', count: 4, texts: ['Aide', "Centre d'aide"] });
    expect(result[1]).toMatchObject({ href: '/contact', count: 2, texts: ['Contact'] });
  });
});
