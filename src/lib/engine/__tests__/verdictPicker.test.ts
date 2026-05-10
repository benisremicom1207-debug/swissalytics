import { describe, it, expect } from 'vitest';
import { djb2, pickVerdictIndex } from '../verdictPicker';

describe('djb2', () => {
  it('returns the same hash for the same input (deterministic)', () => {
    expect(djb2('sunrise-ch-eye3')).toBe(djb2('sunrise-ch-eye3'));
  });

  it('returns different hashes for different inputs', () => {
    expect(djb2('sunrise-ch')).not.toBe(djb2('salt-ch'));
  });

  it('returns a non-negative integer', () => {
    const h = djb2('any-string');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(h)).toBe(true);
  });

  it('handles empty string without throwing', () => {
    expect(() => djb2('')).not.toThrow();
  });
});

describe('pickVerdictIndex', () => {
  it('returns the same index for the same seed (deterministic)', () => {
    expect(pickVerdictIndex('abc-123', 3)).toBe(pickVerdictIndex('abc-123', 3));
  });

  it('returns an index in [0, count)', () => {
    for (const seed of ['a', 'sunrise-ch', 'wingo-ch-yh35', 'pixelab-test']) {
      const idx = pickVerdictIndex(seed, 3);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(3);
    }
  });

  it('distributes seeds reasonably evenly across buckets (sanity)', () => {
    const counts = [0, 0, 0];
    for (let i = 0; i < 300; i++) {
      counts[pickVerdictIndex(`report-${i}`, 3)]++;
    }
    // Each bucket should hold roughly 100 (33%) — allow ±50% drift
    for (const c of counts) {
      expect(c).toBeGreaterThan(50);
      expect(c).toBeLessThan(150);
    }
  });

  it('falls back gracefully on empty seed', () => {
    expect(() => pickVerdictIndex('', 3)).not.toThrow();
    expect(pickVerdictIndex('', 3)).toBe(pickVerdictIndex('', 3));
  });

  it('returns 0 when count is zero (defensive)', () => {
    expect(pickVerdictIndex('any', 0)).toBe(0);
  });
});
