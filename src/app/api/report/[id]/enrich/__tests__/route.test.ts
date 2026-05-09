import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from '../route';
import type { ReportsRepository } from '@/lib/engine/repository';

/**
 * PATCH /api/report/[id]/enrich — body validation + repo wiring.
 *
 * The route is thin: validate body shape, call repo.enrich(), translate
 * null result into 404. These tests cover each branch with a stubbed repo.
 */

const enrich = vi.fn<ReportsRepository['enrich']>();

vi.mock('@/lib/engine/repositoryInstance', () => ({
  getReportsRepo: () => ({ enrich } as unknown as ReportsRepository),
}));

function makeRequest(body: unknown, opts: { malformed?: boolean } = {}) {
  return new Request('http://test/api/report/abc/enrich', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: opts.malformed ? '{not json' : JSON.stringify(body),
  });
}

const params = Promise.resolve({ id: 'abc' });

beforeEach(() => {
  enrich.mockReset();
});

describe('PATCH /api/report/[id]/enrich — validation', () => {
  it('400 on malformed JSON', async () => {
    const res = await PATCH(makeRequest(undefined, { malformed: true }), { params });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid JSON' });
    expect(enrich).not.toHaveBeenCalled();
  });

  it('400 when body is not an object', async () => {
    const res = await PATCH(makeRequest('hello'), { params });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/object/i);
    expect(enrich).not.toHaveBeenCalled();
  });

  it('400 when body is an array', async () => {
    const res = await PATCH(makeRequest([1, 2, 3]), { params });
    expect(res.status).toBe(400);
    expect(enrich).not.toHaveBeenCalled();
  });

  it('400 when neither geoAnalysis nor cwv key is present', async () => {
    const res = await PATCH(makeRequest({}), { params });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/required/);
    expect(enrich).not.toHaveBeenCalled();
  });

  it('400 when geoAnalysis is not an object', async () => {
    const res = await PATCH(makeRequest({ geoAnalysis: 'string' }), { params });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/geoAnalysis/);
    expect(enrich).not.toHaveBeenCalled();
  });

  it('400 when cwv is null', async () => {
    const res = await PATCH(makeRequest({ cwv: null }), { params });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/cwv/);
    expect(enrich).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/report/[id]/enrich — happy path', () => {
  it('forwards geoAnalysis only', async () => {
    enrich.mockResolvedValue({ id: 'abc' } as never);
    const geo = { score: 41 };
    const res = await PATCH(makeRequest({ geoAnalysis: geo }), { params });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(enrich).toHaveBeenCalledWith('abc', { geoAnalysis: geo });
  });

  it('forwards cwv only', async () => {
    enrich.mockResolvedValue({ id: 'abc' } as never);
    const cwv = { coreWebVitals: null, cwvIssues: [], cwvScorePenalty: 0 };
    const res = await PATCH(makeRequest({ cwv }), { params });
    expect(res.status).toBe(200);
    expect(enrich).toHaveBeenCalledWith('abc', { cwv });
  });

  it('forwards both keys when present', async () => {
    enrich.mockResolvedValue({ id: 'abc' } as never);
    const geo = { score: 41 };
    const cwv = { coreWebVitals: null, cwvIssues: [], cwvScorePenalty: 0 };
    await PATCH(makeRequest({ geoAnalysis: geo, cwv }), { params });
    expect(enrich).toHaveBeenCalledWith('abc', { geoAnalysis: geo, cwv });
  });

  it('returns 404 when enrich() returns null (id not found)', async () => {
    enrich.mockResolvedValue(null);
    const res = await PATCH(makeRequest({ cwv: { coreWebVitals: null, cwvIssues: [], cwvScorePenalty: 0 } }), { params });
    expect(res.status).toBe(404);
  });
});
