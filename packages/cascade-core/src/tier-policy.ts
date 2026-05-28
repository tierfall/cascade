import { z } from 'zod';

export const TierPolicySchema = z.object({
  preferLocal: z.boolean(),
  maxCostUsd: z.number().nonnegative(),
  allowedTiers: z.array(z.number().int().min(0).max(4)).min(1),
  fallbackOnError: z.boolean(),
});

// allowedTiers is widened to readonly: defaultPolicy and mergePolicy freeze the
// array so the only safe consumer contract is read-only. Hand-overriding the
// Zod inference is required because z.array().min(1) infers a mutable T[].
export type TierPolicy = Omit<z.infer<typeof TierPolicySchema>, 'allowedTiers'> & {
  readonly allowedTiers: readonly number[];
};

export const defaultPolicy: TierPolicy = Object.freeze({
  preferLocal: true,
  maxCostUsd: 1.0,
  allowedTiers: Object.freeze([0, 1, 2, 3, 4]),
  fallbackOnError: true,
});

export function mergePolicy(base: TierPolicy, partial: Partial<TierPolicy>): TierPolicy {
  const allowedTiers = partial.allowedTiers ?? base.allowedTiers;
  return Object.freeze({
    preferLocal: partial.preferLocal ?? base.preferLocal,
    maxCostUsd: partial.maxCostUsd ?? base.maxCostUsd,
    allowedTiers: Object.freeze([...allowedTiers]),
    fallbackOnError: partial.fallbackOnError ?? base.fallbackOnError,
  });
}
