import { describe, expect, it } from '@jest/globals';
import { llmHandler } from '../src/node-types/llm.js';
import type { NodeResult } from '../src/types.js';

describe('llmHandler', () => {
  it('validateConfig accepts a minimal valid config', () => {
    expect(llmHandler.validateConfig({ prompt: 'hi', policyOverride: undefined }).success).toBe(
      true,
    );
  });

  it('validateConfig rejects a missing prompt', () => {
    expect(llmHandler.validateConfig({}).success).toBe(false);
  });

  it('execute returns a stub completion for v0.1 (real wiring is a backlog issue)', async () => {
    const result = (await llmHandler.execute(
      { prompt: 'hello' },
      { runId: 'r1', nodeId: 'n1' },
    )) as Extract<NodeResult, { kind: 'stub' }>;
    expect(result.kind).toBe('stub');
    expect(typeof result.output).toBe('string');
  });
});
