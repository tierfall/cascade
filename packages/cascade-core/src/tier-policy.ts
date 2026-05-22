import { z } from 'zod';

export const TierPolicySchema = z.object({
  preferLocal: z.boolean(),
  maxCostUsd: z.number().nonnegative(),
  allowedTiers: z.array(z.number().int().min(0).max(4)).min(1),
  fallbackOnError: z.boolean(),
});

export type TierPolicy = z.infer<typeof TierPolicySchema>;

export const defaultPolicy: TierPolicy = Object.freeze({
  preferLocal: true,
  maxCostUsd: 1.0,
  allowedTiers: [0, 1, 2, 3, 4],
  fallbackOnError: true,
});

export function mergePolicy(base: TierPolicy, partial: Partial<TierPolicy>): TierPolicy {
  return Object.freeze({
    preferLocal: partial.preferLocal ?? base.preferLocal,
    maxCostUsd: partial.maxCostUsd ?? base.maxCostUsd,
    allowedTiers: partial.allowedTiers ?? base.allowedTiers,
    fallbackOnError: partial.fallbackOnError ?? base.fallbackOnError,
  });
}
