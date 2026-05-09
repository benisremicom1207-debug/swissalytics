import { describe, it, expect } from 'vitest';
import {
  detectRegionFromDomain,
  getLLMsForRegion,
  REGION_CONFIGS,
  type RegionCode,
} from '../geo-config';

/**
 * Region → LLM priority mapping. After the P11 fix, Mistral (EU-positioned,
 * free-tier-friendly) must be selectable for Swiss / Belgian / Luxembourg
 * sites and the GLOBAL fallback. The previous config only included Mistral
 * for FR, which silently dropped any configured MISTRAL_API_KEY for non-FR
 * sites.
 */

describe('detectRegionFromDomain', () => {
  it('maps .ch to CH', () => {
    expect(detectRegionFromDomain('https://pixelab.ch/')).toBe('CH');
  });
  it('maps .com to US (default for generic TLD)', () => {
    expect(detectRegionFromDomain('https://example.com/')).toBe('US');
  });
  it('maps .fr to FR', () => {
    expect(detectRegionFromDomain('https://example.fr/')).toBe('FR');
  });
  it('falls back to GLOBAL on unknown TLD', () => {
    expect(detectRegionFromDomain('https://example.xyz/')).toBe('GLOBAL');
  });
  it('returns GLOBAL on a malformed URL instead of throwing', () => {
    expect(detectRegionFromDomain('not a url')).toBe('GLOBAL');
  });
});

describe('Mistral availability across regions', () => {
  it.each<RegionCode>(['CH', 'FR', 'BE', 'LU', 'GLOBAL'])(
    'includes mistral in the %s priority list',
    (region) => {
      expect(getLLMsForRegion(region)).toContain('mistral');
    },
  );

  it('keeps mistral OUT of asian region priorities (CN/KR)', () => {
    expect(getLLMsForRegion('CN')).not.toContain('mistral');
    expect(getLLMsForRegion('KR')).not.toContain('mistral');
  });
});

describe('Region configs are internally consistent', () => {
  // For every region, every LLM in llmPriority must have a marketShare entry.
  it.each(Object.entries(REGION_CONFIGS))(
    '%s: every llmPriority entry has a marketShare value',
    (_code, config) => {
      for (const llm of config.llmPriority) {
        expect(config.marketShare[llm], `${config.code}.marketShare missing ${llm}`).toBeDefined();
      }
    },
  );
});
