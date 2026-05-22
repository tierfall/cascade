import type { z } from 'zod';

export interface ExecutionContext {
  runId: string;
  nodeId: string;
  input?: Record<string, unknown>;
}

export type NodeResult =
  | { kind: 'success'; output: unknown }
  | { kind: 'branch'; branch: 'true' | 'false' }
  | { kind: 'http'; status: number; body: unknown }
  | { kind: 'stub'; output: string };

export interface NodeHandler<C = Record<string, unknown>> {
  validateConfig(
    config: unknown,
  ): { success: true; data: C } | { success: false; error: z.ZodError };
  execute(config: C, ctx: ExecutionContext): Promise<NodeResult>;
}
