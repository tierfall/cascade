import { describe, expect, it } from '@jest/globals';
import { CycleDetectedError, WorkflowValidationError } from '../src/errors.js';

describe('WorkflowValidationError', () => {
  it('captures a message with default empty issues', () => {
    const err = new WorkflowValidationError('bad workflow');
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('WorkflowValidationError');
    expect(err.message).toBe('bad workflow');
    expect(err.issues).toEqual([]);
  });

  it('captures issues when provided', () => {
    const err = new WorkflowValidationError('bad workflow', ['missing id', 'empty nodes']);
    expect(err.issues).toEqual(['missing id', 'empty nodes']);
  });
});

describe('CycleDetectedError', () => {
  it('formats the cycle in its message', () => {
    const err = new CycleDetectedError(['a', 'b', 'a']);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CycleDetectedError');
    expect(err.message).toBe('cycle detected: a -> b -> a');
    expect(err.cycle).toEqual(['a', 'b', 'a']);
  });

  it('handles an empty cycle array', () => {
    const err = new CycleDetectedError([]);
    expect(err.message).toBe('cycle detected: ');
    expect(err.cycle).toEqual([]);
  });
});
