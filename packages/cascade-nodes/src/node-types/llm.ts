import { z } from 'zod';
import type { NodeHandler } from '../types.js';

const ConfigSchema = z.object({
  prompt: z.string().min(1),
  policyOverride: z.unknown().optional(),
});

export const llmHandler: NodeHandler<z.infer<typeof ConfigSchema>> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, error: parsed.error };
  },
  execute: async (_config, _ctx) =>
    Promise.resolve({ kind: 'stub', output: '[llm stub — wired to TierFall in v0.1 backlog]' }),
};
