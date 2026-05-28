import jsonata from 'jsonata';
import { z } from 'zod';
import type { NodeHandler, NodeResult } from '../types.js';

const ConfigSchema = z.object({ expression: z.string().min(1) });

type Config = z.infer<typeof ConfigSchema>;

export class TransformExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransformExpressionError';
  }
}

function compile(expression: string): ReturnType<typeof jsonata> {
  try {
    return jsonata(expression);
  } catch (err) {
    // jsonata always throws an Error subclass with a .message.
    const detail = (err as Error).message;
    throw new TransformExpressionError(`jsonata compile error: ${detail}`);
  }
}

export const transformHandler: NodeHandler<Config> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    if (!parsed.success) {
      return { success: false, error: parsed.error };
    }
    try {
      compile(parsed.data.expression);
    } catch (err) {
      const issue: z.ZodIssue = {
        code: 'custom',
        path: ['expression'],
        message: (err as Error).message,
      };
      return { success: false, error: new z.ZodError([issue]) };
    }
    return { success: true, data: parsed.data };
  },
  execute: async (config, ctx): Promise<NodeResult> => {
    const expr = compile(config.expression);
    const output = (await expr.evaluate(ctx.input ?? {})) as unknown;
    return { kind: 'success', output: output ?? null };
  },
};
