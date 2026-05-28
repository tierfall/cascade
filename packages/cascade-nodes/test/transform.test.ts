import { describe, expect, it } from '@jest/globals';
import { transformHandler } from '../src/node-types/transform.js';
import type { NodeResult } from '../src/types.js';

describe('transformHandler.validateConfig', () => {
  it('rejects an empty expression', () => {
    expect(transformHandler.validateConfig({ expression: '' }).success).toBe(false);
  });

  it('accepts a valid jsonata expression', () => {
    expect(transformHandler.validateConfig({ expression: '$' }).success).toBe(true);
  });

  it('rejects a malformed jsonata expression at validate time', () => {
    const result = transformHandler.validateConfig({ expression: '@@@' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['expression']);
    }
  });

  it('surfaces the jsonata error message in the ZodIssue', () => {
    const result = transformHandler.validateConfig({ expression: '(a +' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/.+/);
    }
  });

  it('rejects a missing expression field', () => {
    expect(transformHandler.validateConfig({}).success).toBe(false);
  });
});

describe('transformHandler.execute', () => {
  it('passes input through with the identity expression', async () => {
    const result = (await transformHandler.execute(
      { expression: '$' },
      { runId: 'r', nodeId: 'n', input: { a: 1, b: 2 } },
    )) as Extract<NodeResult, { kind: 'success' }>;
    expect(result.output).toEqual({ a: 1, b: 2 });
  });

  it('projects a field with $.field syntax', async () => {
    const result = (await transformHandler.execute(
      { expression: 'a' },
      { runId: 'r', nodeId: 'n', input: { a: 42, b: 'ignore' } },
    )) as Extract<NodeResult, { kind: 'success' }>;
    expect(result.output).toBe(42);
  });

  it('reshapes the input via object construction', async () => {
    const result = (await transformHandler.execute(
      { expression: '{"sum": a + b}' },
      { runId: 'r', nodeId: 'n', input: { a: 1, b: 2 } },
    )) as Extract<NodeResult, { kind: 'success' }>;
    expect(result.output).toEqual({ sum: 3 });
  });

  it('filters arrays via predicate', async () => {
    const result = (await transformHandler.execute(
      { expression: 'items[value > 1].value' },
      { runId: 'r', nodeId: 'n', input: { items: [{ value: 0 }, { value: 2 }, { value: 5 }] } },
    )) as Extract<NodeResult, { kind: 'success' }>;
    // jsonata returns its own sequence wrapper; flatten via JSON round-trip.
    expect(JSON.parse(JSON.stringify(result.output))).toEqual([2, 5]);
  });

  it('returns null when input is omitted and expression yields nothing', async () => {
    const result = (await transformHandler.execute(
      { expression: 'missing' },
      { runId: 'r', nodeId: 'n' },
    )) as Extract<NodeResult, { kind: 'success' }>;
    expect(result.output).toBeNull();
  });
});

describe('TransformExpressionError surface', () => {
  it('the error name is informative when an expression is invalid', () => {
    const result = transformHandler.validateConfig({ expression: '@@@' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe('custom');
    }
  });
});
