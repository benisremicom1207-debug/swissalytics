/**
 * Real-call integration health checks (P16).
 *
 * Background: P14/P15 shipped with mocked unit tests that all passed
 * green while the prod GEMINI_API_KEY was invalid. Mocked tests can't
 * see that the key is wrong — only a real call to the upstream API
 * can. This module exists so a single endpoint can ping every external
 * integration and surface "ok / invalid_key / timeout / missing_key /
 * error" per provider, in seconds, post-deploy.
 *
 * Each check:
 *   - Returns `missing_key` (not an error) when the env var is absent
 *     so optional providers don't trigger false 503s.
 *   - Hard-caps at HEALTH_TIMEOUT_MS so a hung upstream can't lock
 *     the endpoint.
 *   - Maps HTTP status / error text to a stable status code:
 *       400 + "API_KEY_INVALID" → invalid_key
 *       401 / 403              → invalid_key
 *       AbortError             → timeout
 *       other                  → error
 *   - Issues the cheapest possible call (1-token completion, HEAD,
 *     or a known-light prompt) so a health check costs ~$0.
 */
export type IntegrationStatus = 'ok' | 'missing_key' | 'invalid_key' | 'timeout' | 'error';

export interface IntegrationHealth {
  status: IntegrationStatus;
  latencyMs: number;
  /** Short message — error class, status code, or upstream reason. */
  message?: string;
}

const HEALTH_TIMEOUT_MS = 6_000;
/**
 * PageSpeed dédié : Google PageSpeed Insights peut prendre 30-50s même
 * sur une URL minimale comme example.com (le worker Lighthouse provisionne
 * un browser headless à chaque appel). 6s tuait systématiquement le check
 * en faisant croire à un degraded alors que la clé est OK.
 */
const PAGESPEED_HEALTH_TIMEOUT_MS = 60_000;

function timed<T>(p: Promise<T>): Promise<{ value: T; ms: number }> {
  const start = Date.now();
  return p.then((value) => ({ value, ms: Date.now() - start }));
}

function classifyHttpStatus(status: number, body: string): IntegrationStatus {
  if (status === 401 || status === 403) return 'invalid_key';
  // Google APIs return 400 + INVALID_ARGUMENT for bad keys
  if (status === 400 && /API_KEY_INVALID|API key not valid/i.test(body)) return 'invalid_key';
  return 'error';
}

function classifyError(err: unknown): IntegrationStatus {
  if (err instanceof Error) {
    if (err.name === 'AbortError' || /timeout|aborted/i.test(err.message)) return 'timeout';
  }
  return 'error';
}

async function safeText(res: Response): Promise<string> {
  try { return await res.text(); } catch { return ''; }
}

/* --------------- Gemini --------------- */

export async function checkGemini(): Promise<IntegrationHealth> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { status: 'missing_key', latencyMs: 0 };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'ok' }] }],
        generationConfig: { maxOutputTokens: 1, thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    const ms = Date.now() - start;
    if (res.ok) return { status: 'ok', latencyMs: ms };
    const body = await safeText(res);
    return { status: classifyHttpStatus(res.status, body), latencyMs: ms, message: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err) {
    return { status: classifyError(err), latencyMs: Date.now() - start, message: err instanceof Error ? err.message : 'unknown' };
  }
}

/* --------------- OpenAI --------------- */

export async function checkOpenAI(): Promise<IntegrationHealth> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { status: 'missing_key', latencyMs: 0 };

  // Use /v1/models GET — cheaper than a chat completion, validates auth.
  const start = Date.now();
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` },
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    const ms = Date.now() - start;
    if (res.ok) return { status: 'ok', latencyMs: ms };
    const body = await safeText(res);
    return { status: classifyHttpStatus(res.status, body), latencyMs: ms, message: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err) {
    return { status: classifyError(err), latencyMs: Date.now() - start, message: err instanceof Error ? err.message : 'unknown' };
  }
}

/* --------------- Mistral --------------- */

export async function checkMistral(): Promise<IntegrationHealth> {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return { status: 'missing_key', latencyMs: 0 };

  const start = Date.now();
  try {
    const res = await fetch('https://api.mistral.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` },
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    const ms = Date.now() - start;
    if (res.ok) return { status: 'ok', latencyMs: ms };
    const body = await safeText(res);
    return { status: classifyHttpStatus(res.status, body), latencyMs: ms, message: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err) {
    return { status: classifyError(err), latencyMs: Date.now() - start, message: err instanceof Error ? err.message : 'unknown' };
  }
}

/* --------------- Anthropic --------------- */

export async function checkAnthropic(): Promise<IntegrationHealth> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { status: 'missing_key', latencyMs: 0 };

  const start = Date.now();
  try {
    // Anthropic doesn't expose a public /models endpoint; smallest valid
    // call is a 1-token completion against the cheapest model.
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ok' }],
      }),
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    const ms = Date.now() - start;
    if (res.ok) return { status: 'ok', latencyMs: ms };
    const body = await safeText(res);
    return { status: classifyHttpStatus(res.status, body), latencyMs: ms, message: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err) {
    return { status: classifyError(err), latencyMs: Date.now() - start, message: err instanceof Error ? err.message : 'unknown' };
  }
}

/* --------------- PageSpeed --------------- */

export async function checkPageSpeed(): Promise<IntegrationHealth> {
  const key = process.env.GOOGLE_PAGESPEED_API_KEY;
  if (!key) return { status: 'missing_key', latencyMs: 0 };

  // Hit a tiny, fast site so the call returns quickly. We only care that
  // auth + endpoint accept us, not about the result.
  const start = Date.now();
  try {
    const url =
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed` +
      `?url=https://example.com&key=${key}&category=performance&strategy=mobile`;
    const res = await fetch(url, { signal: AbortSignal.timeout(PAGESPEED_HEALTH_TIMEOUT_MS) });
    const ms = Date.now() - start;
    if (res.ok) return { status: 'ok', latencyMs: ms };
    const body = await safeText(res);
    return { status: classifyHttpStatus(res.status, body), latencyMs: ms, message: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err) {
    return { status: classifyError(err), latencyMs: Date.now() - start, message: err instanceof Error ? err.message : 'unknown' };
  }
}

/* --------------- MOZ --------------- */

export async function checkMoz(): Promise<IntegrationHealth> {
  const key = process.env.MOZ_API_KEY;
  if (!key) return { status: 'missing_key', latencyMs: 0 };

  // MOZ Links API uses POST + token in body; treat any 2xx as ok.
  const start = Date.now();
  try {
    const res = await fetch('https://lsapi.seomoz.com/v2/url_metrics', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${key}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targets: ['example.com'] }),
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    const ms = Date.now() - start;
    if (res.ok) return { status: 'ok', latencyMs: ms };
    const body = await safeText(res);
    return { status: classifyHttpStatus(res.status, body), latencyMs: ms, message: `HTTP ${res.status}: ${body.slice(0, 120)}` };
  } catch (err) {
    return { status: classifyError(err), latencyMs: Date.now() - start, message: err instanceof Error ? err.message : 'unknown' };
  }
}

/* --------------- aggregate --------------- */

export interface AllIntegrationsHealth {
  gemini:    IntegrationHealth;
  openai:    IntegrationHealth;
  mistral:   IntegrationHealth;
  anthropic: IntegrationHealth;
  pagespeed: IntegrationHealth;
  moz:       IntegrationHealth;
}

export async function checkAllIntegrations(): Promise<AllIntegrationsHealth> {
  const [gemini, openai, mistral, anthropic, pagespeed, moz] = await Promise.all([
    checkGemini(),
    checkOpenAI(),
    checkMistral(),
    checkAnthropic(),
    checkPageSpeed(),
    checkMoz(),
  ]);
  return { gemini, openai, mistral, anthropic, pagespeed, moz };
}

/**
 * Compute the aggregate verdict for the endpoint:
 *   - 'ok'       : every CONFIGURED provider returned ok
 *   - 'degraded' : at least one configured provider failed (invalid_key, timeout, error)
 *
 * Missing keys are NOT a failure — they're intentional. The caller can
 * still inspect each provider individually.
 */
export function computeOverallStatus(all: AllIntegrationsHealth): 'ok' | 'degraded' {
  for (const h of Object.values(all)) {
    if (h.status === 'invalid_key' || h.status === 'timeout' || h.status === 'error') {
      return 'degraded';
    }
  }
  return 'ok';
}

/* --------------- test exports --------------- */

export const __test = { classifyHttpStatus, classifyError };
// suppress unused warning when timed() is not consumed externally
void timed;
