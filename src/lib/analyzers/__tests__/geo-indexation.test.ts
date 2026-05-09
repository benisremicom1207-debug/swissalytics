import { describe, it, expect, vi } from 'vitest';

// Break the circular registry import — see gemini.test.ts for context.
vi.mock('../llm-providers/registry', async () => {
  const actual = await vi.importActual<typeof import('../llm-providers/registry')>(
    '../llm-providers/registry',
  );
  return {
    ...actual,
    // Don't re-export the full registry (which eagerly news up every provider)
    LLM_REGISTRY: [],
    getLLMRegistry: () => ({ enabled: [], all: [], totalEnabled: 0 }),
    testAllLLMs: vi.fn(),
    hasAPIKey: () => false,
  };
});

import { convertResultToEngine } from '../geo-indexation';
import type { LLMProvider, LLMTestResult } from '../llm-providers/registry';

/**
 * Pinned regression: `result.metadata.error` MUST flow through to the
 * engine card so a deprecated model or revoked key surfaces as
 * "moteur indisponible" in the UI instead of a misleading indexed=false.
 *
 * This bug existed pre-P3.9: when Google deprecated gemini-2.0-flash,
 * the 404 was caught and stored in metadata.error, but the public
 * engines map dropped it — every site silently showed "Gemini: not
 * indexed" with no way for users or admins to spot the model rot.
 */

const fakeProvider = {
  id: 'fake',
  name: 'FakeLLM',
  company: 'FakeCo',
} as unknown as LLMProvider;

describe('convertResultToEngine', () => {
  it('passes through indexed=true with confidence + mentions', () => {
    const result: LLMTestResult = {
      indexed: true,
      mentions: 5,
      confidence: 'high',
    };
    const engine = convertResultToEngine(result, fakeProvider);
    expect(engine.indexed).toBe(true);
    expect(engine.mentions).toBe(5);
    expect(engine.confidence).toBe('high');
    expect(engine.name).toBe('FakeLLM');
    expect(engine.company).toBe('FakeCo');
    expect(engine.error).toBeUndefined();
  });

  it('passes through indexed=false (real signal) without an error field', () => {
    const result: LLMTestResult = {
      indexed: false,
      mentions: 0,
      confidence: 'none',
    };
    const engine = convertResultToEngine(result, fakeProvider);
    expect(engine.indexed).toBe(false);
    expect(engine.error).toBeUndefined();
  });

  it('propagates metadata.error when the upstream API failed', () => {
    const result: LLMTestResult = {
      indexed: false,
      mentions: 0,
      confidence: 'none',
      metadata: { error: 'Gemini API error: 404 Not Found' },
    };
    const engine = convertResultToEngine(result, fakeProvider);
    expect(engine.error).toBe('Gemini API error: 404 Not Found');
    // indexed stays false but the UI now has a reason to render
    // "moteur indisponible" instead of treating false as a real signal.
    expect(engine.indexed).toBe(false);
  });

  it('handles missing metadata without crashing', () => {
    const result: LLMTestResult = {
      indexed: false,
      mentions: 0,
      confidence: 'none',
    };
    const engine = convertResultToEngine(result, fakeProvider);
    expect(engine.error).toBeUndefined();
  });

  it('handles missing provider (lookup miss) — returns name/company undefined', () => {
    const result: LLMTestResult = {
      indexed: true,
      mentions: 1,
      confidence: 'medium',
    };
    const engine = convertResultToEngine(result, undefined);
    expect(engine.name).toBeUndefined();
    expect(engine.company).toBeUndefined();
    expect(engine.indexed).toBe(true);
  });
});
