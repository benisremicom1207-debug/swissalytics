import { describe, it, expect, vi } from 'vitest';
import {
  withTimeout,
  resolveOrFallback,
  isAnyDegraded,
  lighthouseFallback,
  seoFallback,
  geoIndexationFallback,
  schemaOrgFallback,
  eeatFallback,
  type DegradedFlags,
} from '../resilience';

/**
 * P8 — resilience helpers. The contracts these tests pin:
 *   - withTimeout resolves with the value when fast enough
 *   - withTimeout rejects with isTimeout=true past the deadline
 *   - withTimeout clears its internal timer to avoid open handles
 *   - resolveOrFallback returns the value on fulfilled, calls
 *     fallback() on rejected (and notifies onDegraded)
 *   - all fallbacks return shape-valid sentinel objects with score=0
 *   - isAnyDegraded matches the bitmap of failed analyzers
 */

describe('withTimeout', () => {
  it('resolves with value when promise settles before deadline', async () => {
    const result = await withTimeout(Promise.resolve(42), 100, 'test');
    expect(result).toBe(42);
  });

  it('rejects with timeout error past the deadline', async () => {
    const slow = new Promise<number>((resolve) => setTimeout(() => resolve(1), 100));
    await expect(withTimeout(slow, 20, 'lighthouse')).rejects.toThrow(/lighthouse timeout after 20ms/);
  });

  it('attaches isTimeout=true and label/ms metadata to the error', async () => {
    const slow = new Promise<number>((resolve) => setTimeout(() => resolve(1), 100));
    try {
      await withTimeout(slow, 20, 'eeat');
      throw new Error('should have rejected');
    } catch (err) {
      expect((err as { isTimeout: boolean }).isTimeout).toBe(true);
      expect((err as { label: string }).label).toBe('eeat');
      expect((err as { ms: number }).ms).toBe(20);
    }
  });

  it('propagates the original rejection (not as timeout)', async () => {
    const failing = Promise.reject(new Error('upstream 500'));
    await expect(withTimeout(failing, 100, 'seo')).rejects.toThrow('upstream 500');
  });

  it('clears the timer when the promise resolves first (no leaked handle)', async () => {
    vi.useFakeTimers();
    const result = withTimeout(Promise.resolve('ok'), 5_000, 'test');
    await expect(result).resolves.toBe('ok');
    expect(vi.getTimerCount()).toBe(0); // timeout was cleared
    vi.useRealTimers();
  });
});

describe('resolveOrFallback', () => {
  it('returns the value for a fulfilled settled result', () => {
    const settled: PromiseSettledResult<string> = { status: 'fulfilled', value: 'real' };
    const fallback = vi.fn(() => 'fallback');
    expect(resolveOrFallback(settled, fallback)).toBe('real');
    expect(fallback).not.toHaveBeenCalled();
  });

  it('returns fallback() for a rejected settled result', () => {
    const settled: PromiseSettledResult<string> = { status: 'rejected', reason: new Error('boom') };
    expect(resolveOrFallback(settled, () => 'fallback')).toBe('fallback');
  });

  it('passes the rejection reason string to onDegraded callback', () => {
    const settled: PromiseSettledResult<string> = { status: 'rejected', reason: new Error('timeout after 5000ms') };
    const onDegraded = vi.fn();
    resolveOrFallback(settled, () => 'fb', onDegraded);
    expect(onDegraded).toHaveBeenCalledWith('timeout after 5000ms');
  });

  it('handles non-Error rejection reasons (string, undefined)', () => {
    const stringReason: PromiseSettledResult<string> = { status: 'rejected', reason: 'plain' };
    const onDegraded = vi.fn();
    resolveOrFallback(stringReason, () => 'fb', onDegraded);
    expect(onDegraded).toHaveBeenCalledWith('plain');
  });
});

describe('fallback factories', () => {
  it('lighthouseFallback returns shape-valid result with score=0 and isEstimated=true', () => {
    const fb = lighthouseFallback('timeout');
    expect(fb.performance).toBe(0);
    expect(fb.accessibility).toBe(0);
    expect(fb.bestPractices).toBe(0);
    expect(fb.seo).toBe(0);
    expect(fb.metrics).toEqual({ fcp: 0, lcp: 0, cls: 0, tti: 0 });
    expect(fb.isEstimated).toBe(true);
    expect(fb.warning).toMatch(/timeout/);
  });

  it('seoFallback returns score=0 and false for all booleans', () => {
    const fb = seoFallback();
    expect(fb.score).toBe(0);
    expect(fb.metaTags.title.found).toBe(false);
    expect(fb.metaTags.canonical).toBe(false);
    expect(fb.sitemap).toBe(false);
    expect(fb.headings.h1Count).toBe(0);
  });

  it('geoIndexationFallback returns empty engines map and score=0', () => {
    const fb = geoIndexationFallback();
    expect(fb.score).toBe(0);
    expect(fb.engines).toEqual({});
    expect(fb.totalIndexed).toBe(0);
    expect(fb.totalEnabled).toBe(0);
  });

  it('schemaOrgFallback returns all schemas false', () => {
    const fb = schemaOrgFallback();
    expect(fb.score).toBe(0);
    expect(fb.totalFound).toBe(0);
    for (const v of Object.values(fb.schemas)) expect(v).toBe(false);
  });

  it('eeatFallback returns all signals false/zero', () => {
    const fb = eeatFallback();
    expect(fb.score).toBe(0);
    expect(fb.signals.teamPage.found).toBe(false);
    expect(fb.signals.legalMentions).toBe(false);
    expect(fb.signals.contactPage.found).toBe(false);
    expect(fb.signals.testimonials.count).toBe(0);
    expect(fb.signals.backlinks.total).toBe(0);
  });
});

describe('isAnyDegraded', () => {
  it('returns false when all flags are false', () => {
    const d: DegradedFlags = { lighthouse: false, seo: false, geo: false, schema: false, eeat: false };
    expect(isAnyDegraded(d)).toBe(false);
  });

  it.each([
    ['lighthouse'],
    ['seo'],
    ['geo'],
    ['schema'],
    ['eeat'],
  ] as const)('returns true when only %s is degraded', (key) => {
    const d: DegradedFlags = { lighthouse: false, seo: false, geo: false, schema: false, eeat: false };
    d[key] = true;
    expect(isAnyDegraded(d)).toBe(true);
  });

  it('returns true when multiple flags are set', () => {
    expect(isAnyDegraded({ lighthouse: true, seo: false, geo: true, schema: false, eeat: true })).toBe(true);
  });
});
