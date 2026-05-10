/**
 * Tests for the integration-health module.
 *
 * Two distinct test groups:
 *   1. Mocked unit tests (always run): verify the classification logic
 *      — given an HTTP status / body, do we map to the right
 *      IntegrationStatus? Cheap, fast, deterministic.
 *   2. Live integration tests (skipped by default, opt-in via
 *      RUN_LIVE_INTEGRATIONS=1): hit the REAL upstream APIs with the
 *      keys in `.env.local`. These are the tests that would have
 *      caught the prod GEMINI_API_KEY=invalid bug — mocks can't.
 *
 * Run live: `RUN_LIVE_INTEGRATIONS=1 pnpm vitest run src/lib/integrations`
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  __test,
  checkGemini,
  checkOpenAI,
  checkMistral,
  checkAnthropic,
  checkPageSpeed,
  checkMoz,
  checkAllIntegrations,
  computeOverallStatus,
  type AllIntegrationsHealth,
} from '../health';

const { classifyHttpStatus, classifyError } = __test;

const originalFetch = global.fetch;
const KEYS = ['GEMINI_API_KEY', 'OPENAI_API_KEY', 'MISTRAL_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_PAGESPEED_API_KEY', 'MOZ_API_KEY'] as const;
const originalKeys: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    originalKeys[k] = process.env[k];
    delete process.env[k];
  }
  global.fetch = vi.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  for (const k of KEYS) {
    if (originalKeys[k] === undefined) delete process.env[k];
    else process.env[k] = originalKeys[k];
  }
  vi.restoreAllMocks();
});

/* --------------- classification --------------- */

describe('classifyHttpStatus', () => {
  it('maps 401 → invalid_key', () => {
    expect(classifyHttpStatus(401, '')).toBe('invalid_key');
  });
  it('maps 403 → invalid_key', () => {
    expect(classifyHttpStatus(403, '')).toBe('invalid_key');
  });
  it('maps Google 400 + API_KEY_INVALID → invalid_key (the prod bug)', () => {
    expect(classifyHttpStatus(400, '{"error":{"reason":"API_KEY_INVALID"}}')).toBe('invalid_key');
    expect(classifyHttpStatus(400, 'API key not valid. Please pass a valid API key.')).toBe('invalid_key');
  });
  it('maps generic 400 → error (not invalid_key)', () => {
    expect(classifyHttpStatus(400, 'malformed payload')).toBe('error');
  });
  it('maps 500 → error', () => {
    expect(classifyHttpStatus(500, '')).toBe('error');
  });
});

describe('classifyError', () => {
  it('maps AbortError → timeout', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    expect(classifyError(err)).toBe('timeout');
  });
  it('maps "timeout" message → timeout', () => {
    expect(classifyError(new Error('connection timeout after 6000ms'))).toBe('timeout');
  });
  it('maps unknown errors → error', () => {
    expect(classifyError(new Error('connection reset'))).toBe('error');
    expect(classifyError(new Error('ENOTFOUND'))).toBe('error');
    expect(classifyError('not even an Error')).toBe('error');
  });
});

/* --------------- per-provider checks (mocked) --------------- */

describe('checkGemini', () => {
  it('returns missing_key (no fetch call) when GEMINI_API_KEY absent', async () => {
    const r = await checkGemini();
    expect(r.status).toBe('missing_key');
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it('returns ok on HTTP 200', async () => {
    process.env.GEMINI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    const r = await checkGemini();
    expect(r.status).toBe('ok');
    expect(r.latencyMs).toBeGreaterThanOrEqual(0);
  });
  it('returns invalid_key on Google 400 + API_KEY_INVALID (the prod bug we just hit)', async () => {
    process.env.GEMINI_API_KEY = 'INVALID';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false, status: 400,
      text: async () => '{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","reason":"API_KEY_INVALID"}}',
    });
    const r = await checkGemini();
    expect(r.status).toBe('invalid_key');
    expect(r.message).toContain('400');
  });
  it('returns timeout on AbortError', async () => {
    process.env.GEMINI_API_KEY = 'TEST';
    const err = new Error('aborted');
    err.name = 'AbortError';
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(err);
    const r = await checkGemini();
    expect(r.status).toBe('timeout');
  });
  it('uses gemini-2.5-flash with thinking disabled in the probe call', async () => {
    process.env.GEMINI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    await checkGemini();
    const [calledUrl, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(calledUrl).toContain('gemini-2.5-flash:generateContent');
    const body = JSON.parse(init.body);
    expect(body.generationConfig.thinkingConfig.thinkingBudget).toBe(0);
    expect(body.generationConfig.maxOutputTokens).toBe(1);
  });
});

describe('checkOpenAI', () => {
  it('returns missing_key when OPENAI_API_KEY absent', async () => {
    const r = await checkOpenAI();
    expect(r.status).toBe('missing_key');
  });
  it('returns ok on 200', async () => {
    process.env.OPENAI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    expect((await checkOpenAI()).status).toBe('ok');
  });
  it('returns invalid_key on 401', async () => {
    process.env.OPENAI_API_KEY = 'BAD';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 401, text: async () => '{"error":"Incorrect API key"}' });
    expect((await checkOpenAI()).status).toBe('invalid_key');
  });
  it('hits /v1/models with bearer auth', async () => {
    process.env.OPENAI_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    await checkOpenAI();
    const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/models');
    expect(init.headers.Authorization).toBe('Bearer TEST');
  });
});

describe('checkMistral', () => {
  it('returns missing_key when MISTRAL_API_KEY absent', async () => {
    expect((await checkMistral()).status).toBe('missing_key');
  });
  it('returns invalid_key on 401', async () => {
    process.env.MISTRAL_API_KEY = 'BAD';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 401, text: async () => '' });
    expect((await checkMistral()).status).toBe('invalid_key');
  });
});

describe('checkAnthropic', () => {
  it('returns missing_key when ANTHROPIC_API_KEY absent', async () => {
    expect((await checkAnthropic()).status).toBe('missing_key');
  });
  it('returns ok on 200', async () => {
    process.env.ANTHROPIC_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    expect((await checkAnthropic()).status).toBe('ok');
  });
  it('uses x-api-key header (not Authorization)', async () => {
    process.env.ANTHROPIC_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    await checkAnthropic();
    const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers['x-api-key']).toBe('TEST');
    expect(init.headers.Authorization).toBeUndefined();
  });
});

describe('checkPageSpeed', () => {
  it('returns missing_key when GOOGLE_PAGESPEED_API_KEY absent (prod-only key)', async () => {
    expect((await checkPageSpeed()).status).toBe('missing_key');
  });
  it('uses example.com as the probe target (cheapest fast site)', async () => {
    process.env.GOOGLE_PAGESPEED_API_KEY = 'TEST';
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    await checkPageSpeed();
    const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toContain('url=https://example.com');
    expect(url).toContain('key=TEST');
  });
});

describe('checkMoz', () => {
  it('returns missing_key when MOZ_API_KEY absent', async () => {
    expect((await checkMoz()).status).toBe('missing_key');
  });
});

/* --------------- aggregate --------------- */

describe('checkAllIntegrations', () => {
  it('runs all 6 checks in parallel', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 200, text: async () => '' });
    const all = await checkAllIntegrations();
    // No keys set → all missing_key, no fetch calls
    expect(all.gemini.status).toBe('missing_key');
    expect(all.openai.status).toBe('missing_key');
    expect(all.mistral.status).toBe('missing_key');
    expect(all.anthropic.status).toBe('missing_key');
    expect(all.pagespeed.status).toBe('missing_key');
    expect(all.moz.status).toBe('missing_key');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('computeOverallStatus', () => {
  const base: AllIntegrationsHealth = {
    gemini:    { status: 'missing_key', latencyMs: 0 },
    openai:    { status: 'missing_key', latencyMs: 0 },
    mistral:   { status: 'missing_key', latencyMs: 0 },
    anthropic: { status: 'missing_key', latencyMs: 0 },
    pagespeed: { status: 'missing_key', latencyMs: 0 },
    moz:       { status: 'missing_key', latencyMs: 0 },
  };

  it('returns ok when all are missing_key (no failure, just nothing configured)', () => {
    expect(computeOverallStatus(base)).toBe('ok');
  });
  it('returns ok when configured providers all answered ok', () => {
    expect(computeOverallStatus({ ...base, gemini: { status: 'ok', latencyMs: 50 }, openai: { status: 'ok', latencyMs: 80 } })).toBe('ok');
  });
  it('returns degraded when ANY configured provider has invalid_key (the prod scenario)', () => {
    expect(computeOverallStatus({ ...base, gemini: { status: 'invalid_key', latencyMs: 50 } })).toBe('degraded');
  });
  it('returns degraded on timeout', () => {
    expect(computeOverallStatus({ ...base, openai: { status: 'timeout', latencyMs: 6000 } })).toBe('degraded');
  });
  it('returns degraded on generic error', () => {
    expect(computeOverallStatus({ ...base, mistral: { status: 'error', latencyMs: 100 } })).toBe('degraded');
  });
});

/* --------------- LIVE integration tests --------------- */

/**
 * Opt-in live tests. Set RUN_LIVE_INTEGRATIONS=1 to run.
 * These call the REAL upstream APIs using the keys in .env.local.
 * They WILL fail if a key is invalid — which is exactly what we want
 * post-deploy to surface.
 *
 * Why opt-in: they're slower (200-2000ms each), cost a tiny amount on
 * paid providers, and are flaky on transient upstream issues. Run them
 * locally before pushing, in nightly CI, or on demand from prod.
 */
describe.skipIf(process.env.RUN_LIVE_INTEGRATIONS !== '1')('LIVE integrations', () => {
  beforeEach(() => {
    // Restore real fetch + real env for live calls
    global.fetch = originalFetch;
    for (const k of KEYS) {
      if (originalKeys[k] !== undefined) process.env[k] = originalKeys[k];
    }
  });

  it('Gemini key is valid (catches API_KEY_INVALID)', async () => {
    const r = await checkGemini();
    if (r.status === 'missing_key') return; // skip if not configured
    expect(r.status, `Gemini failed: ${r.message}`).toBe('ok');
  }, 10_000);

  it('OpenAI key is valid', async () => {
    const r = await checkOpenAI();
    if (r.status === 'missing_key') return;
    expect(r.status, `OpenAI failed: ${r.message}`).toBe('ok');
  }, 10_000);

  it('Mistral key is valid', async () => {
    const r = await checkMistral();
    if (r.status === 'missing_key') return;
    expect(r.status, `Mistral failed: ${r.message}`).toBe('ok');
  }, 10_000);

  it('Anthropic key is valid', async () => {
    const r = await checkAnthropic();
    if (r.status === 'missing_key') return;
    expect(r.status, `Anthropic failed: ${r.message}`).toBe('ok');
  }, 10_000);

  it('PageSpeed key is valid (skipped locally, prod-only)', async () => {
    const r = await checkPageSpeed();
    if (r.status === 'missing_key') return;
    expect(r.status, `PageSpeed failed: ${r.message}`).toBe('ok');
  }, 15_000);
});
