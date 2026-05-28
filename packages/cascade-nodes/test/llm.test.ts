import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import type { Adapter, LLMRequest, LLMResponse } from '@tierfall/core';
import { getLlmAdapters, llmHandler, setLlmAdapters } from '../src/node-types/llm.js';
import type { NodeResult } from '../src/types.js';

function fakeAdapter(name: string, tier: Adapter['tier'], response: Partial<LLMResponse>): Adapter {
  return {
    name,
    tier,
    capability: {
      contextWindowTokens: 8000,
      supportsTools: false,
      supportsStreaming: false,
      supportsStructuredOutput: false,
      costPerMillionInputTokens: 0,
      costPerMillionOutputTokens: 0,
    },
    complete: (_req: LLMRequest): Promise<LLMResponse> =>
      Promise.resolve({
        text: response.text ?? `response from ${name}`,
        tier,
        model: response.model ?? 'fake-model',
        usage: response.usage ?? { inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0 },
        fallChain: response.fallChain ?? [],
      }),
  };
}

describe('llmHandler.validateConfig', () => {
  it('accepts a minimal valid config', () => {
    expect(llmHandler.validateConfig({ prompt: 'hi' }).success).toBe(true);
  });

  it('rejects a missing prompt', () => {
    expect(llmHandler.validateConfig({}).success).toBe(false);
  });

  it('accepts optional tuning fields', () => {
    expect(
      llmHandler.validateConfig({
        prompt: 'hi',
        model: 'llama3',
        temperature: 0.7,
        maxOutputTokens: 256,
        maxCostUsd: 0.01,
      }).success,
    ).toBe(true);
  });

  it('rejects out-of-range temperature', () => {
    expect(llmHandler.validateConfig({ prompt: 'hi', temperature: 3 }).success).toBe(false);
  });
});

describe('llmHandler.execute (no adapters registered)', () => {
  beforeEach(() => {
    setLlmAdapters([]);
  });

  it('returns a stub when no adapters are registered', async () => {
    const result = (await llmHandler.execute(
      { prompt: 'hello' },
      { runId: 'r', nodeId: 'n' },
    )) as Extract<NodeResult, { kind: 'stub' }>;
    expect(result.kind).toBe('stub');
    expect(typeof result.output).toBe('string');
  });
});

describe('llmHandler.execute (adapters registered)', () => {
  beforeEach(() => {
    setLlmAdapters([fakeAdapter('local', 'on-device', { text: 'hi back' })]);
  });

  afterEach(() => {
    setLlmAdapters([]);
  });

  it('routes through TierFall and returns tier-attributed output', async () => {
    const result = (await llmHandler.execute(
      { prompt: 'hello' },
      { runId: 'r', nodeId: 'n' },
    )) as Extract<NodeResult, { kind: 'success' }>;
    expect(result.kind).toBe('success');
    const output = result.output as {
      text: string;
      tier: string;
      tierIndex: number;
      model: string;
    };
    expect(output.text).toBe('hi back');
    expect(output.tier).toBe('on-device');
    expect(output.tierIndex).toBe(0);
  });

  it('forwards optional tuning fields into the LLMRequest', async () => {
    let captured: LLMRequest | undefined;
    const capturingAdapter: Adapter = {
      name: 'capture',
      tier: 'on-device',
      capability: {
        contextWindowTokens: 8000,
        supportsTools: false,
        supportsStreaming: false,
        supportsStructuredOutput: false,
        costPerMillionInputTokens: 0,
        costPerMillionOutputTokens: 0,
      },
      complete: (req: LLMRequest): Promise<LLMResponse> => {
        captured = req;
        return Promise.resolve({
          text: '',
          tier: 'on-device',
          model: 'fake',
          usage: { inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0 },
          fallChain: [],
        });
      },
    };
    setLlmAdapters([capturingAdapter]);
    await llmHandler.execute(
      {
        prompt: 'hello',
        model: 'llama3',
        maxOutputTokens: 64,
        temperature: 0.5,
        maxCostUsd: 0.001,
      },
      { runId: 'r', nodeId: 'n' },
    );
    expect(captured?.model).toBe('llama3');
    expect(captured?.maxOutputTokens).toBe(64);
    expect(captured?.temperature).toBe(0.5);
    expect(captured?.maxCostUSD).toBe(0.001);
  });

  it('falls to a cheaper tier on adapter failure', async () => {
    const failing: Adapter = {
      ...fakeAdapter('cloud', 'premium-cloud', {}),
      complete: () => Promise.reject(new Error('cloud down')),
    };
    const fallback = fakeAdapter('local', 'on-device', { text: 'served by local' });
    setLlmAdapters([failing, fallback]);
    const result = (await llmHandler.execute(
      { prompt: 'hello' },
      { runId: 'r', nodeId: 'n' },
    )) as Extract<NodeResult, { kind: 'success' }>;
    const output = result.output as { text: string; tier: string };
    expect(output.text).toBe('served by local');
    expect(output.tier).toBe('on-device');
  });
});

describe('setLlmAdapters / getLlmAdapters', () => {
  afterEach(() => {
    setLlmAdapters([]);
  });

  it('round-trips registration', () => {
    const adapter = fakeAdapter('x', 'self-hosted-edge', {});
    setLlmAdapters([adapter]);
    expect(getLlmAdapters()).toEqual([adapter]);
  });
});
