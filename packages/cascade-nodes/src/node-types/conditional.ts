import jexl from 'jexl';
import { z } from 'zod';
import type { NodeHandler, NodeResult } from '../types.js';

const ConfigSchema = z.object({ expression: z.string().min(1) });

type Config = z.infer<typeof ConfigSchema>;

export class ConditionalExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConditionalExpressionError';
  }
}

const engine = new jexl.Jexl();

function compile(expression: string): ReturnType<typeof engine.compile> {
  try {
    return engine.compile(expression);
  } catch (err) {
    throw new ConditionalExpressionError(`jexl compile error: ${(err as Error).message}`);
  }
}

export const conditionalHandler: NodeHandler<Config> = {
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
    // Wrap input under an `input.` namespace so expressions can reference
    // input.x. jexl runtime errors (missing properties, type mismatches)
    // are coerced to false rather than thrown — this keeps a misconfigured
    // conditional from crashing the whole run.
    const context = { input: ctx.input ?? {} };
    let result: unknown;
    try {
      result = await expr.eval(context);
    } catch {
      return { kind: 'branch', branch: 'false' };
    }
    const truthy = Boolean(result);
    return { kind: 'branch', branch: truthy ? 'true' : 'false' };
  },
};
