import { z } from 'zod';
import type { NodeHandler } from '../types.js';

const ConfigSchema = z.object({ expression: z.string().min(1) });

export const transformHandler: NodeHandler<z.infer<typeof ConfigSchema>> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, error: parsed.error };
  },
  execute: async (_config, ctx) =>
    // v0.1 stub: passthrough. jsonata wiring is a backlog issue.
    Promise.resolve({ kind: 'success', output: ctx.input ?? {} }),
};
