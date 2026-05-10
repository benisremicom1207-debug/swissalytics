import { describe, it, expect } from 'vitest';
import { categorizeTech, groupTechsByCategory, CATEGORY_LABELS } from '../tech-categories';

describe('categorizeTech', () => {
  it.each([
    ['React', 'framework'],
    ['Vue.js', 'framework'],
    ['Angular', 'framework'],
    ['Google Analytics', 'analytics'],
    ['GTM', 'analytics'],
    ['Meta Pixel', 'analytics'],
    ['Hotjar', 'analytics'],
    ['YouTube', 'embed'],
    ['Vimeo', 'embed'],
    ['Google Maps', 'embed'],
    ['HubSpot', 'embed'],
    ['Mailchimp', 'embed'],
    ['jQuery', 'library'],
    ['Bootstrap', 'library'],
    ['Tailwind CSS', 'library'],
    ['Polyfill.io', 'library'],
    ['Cloudflare', 'other'],
    ['reCAPTCHA', 'other'],
    ['Schema.org', 'other'],
    ['Google Fonts', 'other'],
  ] as const)('categorizes %s as %s', (tech, expected) => {
    expect(categorizeTech(tech)).toBe(expected);
  });

  it('falls back to "other" for unknown tech (never silently drops)', () => {
    expect(categorizeTech('SomeBrandNewToolWeNeverHeardOf')).toBe('other');
  });
});

describe('groupTechsByCategory', () => {
  it('returns ordered buckets in canonical order (framework → library → analytics → embed → other)', () => {
    const result = groupTechsByCategory(['Schema.org', 'YouTube', 'Google Analytics', 'jQuery', 'React']);
    expect(result.map((b) => b.category)).toEqual(['framework', 'library', 'analytics', 'embed', 'other']);
  });

  it('preserves insertion order within each bucket', () => {
    const result = groupTechsByCategory(['Vimeo', 'YouTube', 'Google Maps']);
    const embed = result.find((b) => b.category === 'embed')!;
    expect(embed.techs).toEqual(['Vimeo', 'YouTube', 'Google Maps']);
  });

  it('omits empty buckets', () => {
    const result = groupTechsByCategory(['Google Analytics']);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('analytics');
  });

  it('returns empty array for no techs', () => {
    expect(groupTechsByCategory([])).toEqual([]);
  });

  it('groups a real-world sunrise.ch fixture (Angular + Schema.org + YouTube) into 3 buckets', () => {
    const result = groupTechsByCategory(['Angular', 'Schema.org', 'YouTube']);
    expect(result).toHaveLength(3);
    expect(result.map((b) => `${b.category}:${b.techs.join(',')}`)).toEqual([
      'framework:Angular',
      'embed:YouTube',
      'other:Schema.org',
    ]);
  });
});

describe('CATEGORY_LABELS', () => {
  it('has FR + EN label for every category', () => {
    for (const cat of ['framework', 'analytics', 'embed', 'library', 'other'] as const) {
      expect(CATEGORY_LABELS[cat].fr).toBeTruthy();
      expect(CATEGORY_LABELS[cat].en).toBeTruthy();
    }
  });
});
