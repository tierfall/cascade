import { describe, expect, it } from '@jest/globals';
import { transformHandler } from '../src/node-types/transform.js';
import type { NodeResult } from '../src/types.js';

describe('transformHandler', () => {
  it('applies a jsonata-like expression (stub for v0.1: passthrough)', async () => {
    const result = (await transformHandler.execute(
      { expression: '$' },
      { runId: 'r', nodeId: 'n', input: { a: 1 } },
    )) as Extract<NodeResult, { kind: 'success' }>;
    expect(result.output).toEqual({ a: 1 });
  });

  it('rejects empty expression', () => {
    expect(transformHandler.validateConfig({ expression: '' }).success).toBe(false);
  });

  it('accepts a valid expression', () => {
    expect(transformHandler.validateConfig({ expression: '$' }).success).toBe(true);
  });

  it('returns empty object when no input is provided (passthrough stub)', async () => {
    const result = (await transformHandler.execute(
      { expression: '$' },
      { runId: 'r', nodeId: 'n' },
    )) as Extract<NodeResult, { kind: 'success' }>;
    expect(result.output).toEqual({});
  });
});
