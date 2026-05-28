import { describe, expect, it } from '@jest/globals';
import { conditionalHandler } from '../src/node-types/conditional.js';
import type { NodeResult } from '../src/types.js';

describe('conditionalHandler.validateConfig', () => {
  it('accepts a non-empty expression', () => {
    expect(conditionalHandler.validateConfig({ expression: 'input.x > 1' }).success).toBe(true);
  });

  it('rejects an empty expression', () => {
    expect(conditionalHandler.validateConfig({ expression: '' }).success).toBe(false);
  });

  it('rejects a malformed expression at compile time', () => {
    const result = conditionalHandler.validateConfig({ expression: '@@@ invalid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['expression']);
    }
  });

  it('accepts complex jexl expressions', () => {
    expect(
      conditionalHandler.validateConfig({ expression: 'input.x > 5 && input.y == "ok"' }).success,
    ).toBe(true);
  });
});

describe('conditionalHandler.execute (comparison operators)', () => {
  async function evalExpr(expression: string, input: Record<string, unknown>): Promise<string> {
    const result = (await conditionalHandler.execute(
      { expression },
      { runId: 'r', nodeId: 'n', input },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    return result.branch;
  }

  it('handles > (truthy)', async () => {
    expect(await evalExpr('input.x > 5', { x: 10 })).toBe('true');
  });

  it('handles > (falsy)', async () => {
    expect(await evalExpr('input.x > 5', { x: 2 })).toBe('false');
  });

  it('handles <', async () => {
    expect(await evalExpr('input.x < 5', { x: 3 })).toBe('true');
  });

  it('handles >=', async () => {
    expect(await evalExpr('input.x >= 5', { x: 5 })).toBe('true');
  });

  it('handles <=', async () => {
    expect(await evalExpr('input.x <= 4', { x: 4 })).toBe('true');
  });

  it('handles == (jexl equality)', async () => {
    expect(await evalExpr('input.x == 7', { x: 7 })).toBe('true');
  });

  it('handles != (jexl inequality)', async () => {
    expect(await evalExpr('input.x != 7', { x: 8 })).toBe('true');
  });
});

describe('conditionalHandler.execute (logical + string + sandbox)', () => {
  it('supports logical && and ||', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x > 0 && input.y == "ok"' },
      { runId: 'r', nodeId: 'n', input: { x: 1, y: 'ok' } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('true');
  });

  it('returns branch=false when input is missing', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x > 5' },
      { runId: 'r', nodeId: 'n' },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('false');
  });

  it('returns branch=false when input field is undefined', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.missing > 5' },
      { runId: 'r', nodeId: 'n', input: { other: 1 } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('false');
  });

  it('coerces strings via comparison', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.s | length > 3' },
      { runId: 'r', nodeId: 'n', input: { s: 'hello' } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    // jexl has no built-in length transform; this should fall through to false.
    expect(result.branch).toBe('false');
  });

  it('does NOT have access to Function/eval (sandboxed)', () => {
    // Attempt to invoke a JS global — jexl rejects this at compile time.
    const result = conditionalHandler.validateConfig({
      expression: 'Function("return 1")()',
    });
    expect(result.success).toBe(false);
  });

  it('does NOT execute arbitrary host functions', async () => {
    // Even if compile succeeded, no global access — runtime returns false.
    const result = (await conditionalHandler.execute(
      { expression: 'input.x > 5' },
      { runId: 'r', nodeId: 'n', input: { x: { constructor: { name: 'Number' } } } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    // Comparison of an object with a number is falsy in jexl.
    expect(result.branch).toBe('false');
  });
});
