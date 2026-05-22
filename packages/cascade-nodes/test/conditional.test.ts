import { describe, expect, it } from '@jest/globals';
import { conditionalHandler } from '../src/node-types/conditional.js';
import type { NodeResult } from '../src/types.js';

describe('conditionalHandler', () => {
  it('validateConfig accepts a non-empty expression', () => {
    expect(conditionalHandler.validateConfig({ expression: 'x > 1' }).success).toBe(true);
  });

  it('validateConfig rejects an empty expression', () => {
    expect(conditionalHandler.validateConfig({ expression: '' }).success).toBe(false);
  });

  it('execute evaluates the expression against context.input (truthy -> success)', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x > 5' },
      { runId: 'r', nodeId: 'n', input: { x: 10 } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.kind).toBe('branch');
    expect(result.branch).toBe('true');
  });

  it('execute returns branch=false on falsy evaluation', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x > 5' },
      { runId: 'r', nodeId: 'n', input: { x: 2 } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('false');
  });

  it('execute returns branch=false for less-than operator', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x < 5' },
      { runId: 'r', nodeId: 'n', input: { x: 3 } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('true');
  });

  it('execute handles >= operator', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x >= 5' },
      { runId: 'r', nodeId: 'n', input: { x: 5 } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('true');
  });

  it('execute handles <= operator', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x <= 4' },
      { runId: 'r', nodeId: 'n', input: { x: 4 } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('true');
  });

  it('execute handles === operator', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x === 7' },
      { runId: 'r', nodeId: 'n', input: { x: 7 } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('true');
  });

  it('execute handles !== operator', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x !== 7' },
      { runId: 'r', nodeId: 'n', input: { x: 8 } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('true');
  });

  it('execute returns branch=false for malformed expression', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'completely.invalid()' },
      { runId: 'r', nodeId: 'n', input: { x: 1 } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('false');
  });

  it('execute returns branch=false when input value is not a number', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x > 5' },
      { runId: 'r', nodeId: 'n', input: { x: 'notanumber' } },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('false');
  });

  it('execute returns branch=false when input is missing', async () => {
    const result = (await conditionalHandler.execute(
      { expression: 'input.x > 5' },
      { runId: 'r', nodeId: 'n' },
    )) as Extract<NodeResult, { kind: 'branch' }>;
    expect(result.branch).toBe('false');
  });
});
