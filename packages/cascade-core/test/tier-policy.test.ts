import { describe, expect, it } from '@jest/globals';
import { TierPolicySchema, defaultPolicy, mergePolicy } from '../src/tier-policy.js';

describe('TierPolicySchema', () => {
  it('parses a fully-specified policy', () => {
    const result = TierPolicySchema.safeParse({
      preferLocal: true,
      maxCostUsd: 0.1,
      allowedTiers: [0, 1, 2],
      fallbackOnError: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative maxCostUsd', () => {
    expect(
      TierPolicySchema.safeParse({
        preferLocal: true,
        maxCostUsd: -1,
        allowedTiers: [0],
        fallbackOnError: false,
      }).success,
    ).toBe(false);
  });

  it('rejects an empty allowedTiers list', () => {
    expect(
      TierPolicySchema.safeParse({
        preferLocal: true,
        maxCostUsd: 1,
        allowedTiers: [],
        fallbackOnError: false,
      }).success,
    ).toBe(false);
  });
});

describe('defaultPolicy', () => {
  it('is local-preferring, low-cost, all-tiers-allowed', () => {
    expect(defaultPolicy.preferLocal).toBe(true);
    expect(defaultPolicy.maxCostUsd).toBeLessThanOrEqual(1.0);
    expect(defaultPolicy.allowedTiers).toEqual([0, 1, 2, 3, 4]);
    expect(defaultPolicy.fallbackOnError).toBe(true);
  });
});

describe('mergePolicy', () => {
  it('overrides default fields with provided partial', () => {
    const merged = mergePolicy(defaultPolicy, { maxCostUsd: 0.5 });
    expect(merged.maxCostUsd).toBe(0.5);
    expect(merged.preferLocal).toBe(defaultPolicy.preferLocal);
  });

  it('returns a frozen object', () => {
    const merged = mergePolicy(defaultPolicy, {});
    expect(Object.isFrozen(merged)).toBe(true);
  });

  it('freezes the allowedTiers array on the result', () => {
    const merged = mergePolicy(defaultPolicy, {});
    expect(Object.isFrozen(merged.allowedTiers)).toBe(true);
    const escapeHatch = merged.allowedTiers as number[];
    expect(() => escapeHatch.push(99)).toThrow(TypeError);
  });

  it('copies allowedTiers so mutating the source does not bleed into the result', () => {
    const source = [0, 1];
    const merged = mergePolicy(defaultPolicy, { allowedTiers: source });
    source.push(99);
    expect(merged.allowedTiers).toEqual([0, 1]);
  });

  it('freezes defaultPolicy.allowedTiers', () => {
    expect(Object.isFrozen(defaultPolicy.allowedTiers)).toBe(true);
    const escapeHatch = defaultPolicy.allowedTiers as number[];
    expect(() => escapeHatch.push(99)).toThrow(TypeError);
  });
});
