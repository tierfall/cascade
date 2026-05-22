import { z } from 'zod';
import type { NodeHandler } from '../types.js';

const ConfigSchema = z.object({ expression: z.string().min(1) });

export const conditionalHandler: NodeHandler<z.infer<typeof ConfigSchema>> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, error: parsed.error };
  },
  execute: (config, ctx) => {
    const input = ctx.input ?? {};
    // v0.1 stub: only supports `input.X (op) literal` form. Full expression engine
    // is a v0.1 backlog issue (use jexl or expr-eval, decided in implementation PR).
    const truthy = evaluateSimple(config.expression, input);
    return Promise.resolve({ kind: 'branch', branch: truthy ? 'true' : 'false' });
  },
};

function evaluateSimple(expr: string, input: Record<string, unknown>): boolean {
  // Named capture groups make types non-optional — regex is the single source of truth.
  const match = /^input\.(?<key>\w+)\s*(?<op>>|<|>=|<=|===|!==)\s*(?<rhs>\d+(?:\.\d+)?)$/u.exec(
    expr,
  );
  if (!match?.groups) return false;
  const { key, op, rhs: rhsStr } = match.groups;
  if (key === undefined || op === undefined || rhsStr === undefined) return false;
  const lhsRaw = input[key];
  if (typeof lhsRaw !== 'number') return false;
  const rhs = Number(rhsStr);
  if (op === '>') return lhsRaw > rhs;
  if (op === '<') return lhsRaw < rhs;
  if (op === '>=') return lhsRaw >= rhs;
  if (op === '<=') return lhsRaw <= rhs;
  if (op === '===') return lhsRaw === rhs;
  // op === '!=='
  return lhsRaw !== rhs;
}
