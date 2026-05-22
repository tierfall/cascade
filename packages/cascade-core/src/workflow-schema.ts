import { z } from 'zod';

const NODE_TYPES = ['llm', 'conditional', 'transform', 'http'] as const;

const NodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NODE_TYPES),
  config: z.record(z.unknown()),
});

const EdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
});

const TriggerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('webhook'), path: z.string() }),
  z.object({ kind: z.literal('cron'), schedule: z.string() }),
  z.object({ kind: z.literal('manual') }),
]);

export const WorkflowSchema = z
  .object({
    schemaVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    id: z.string().min(1),
    name: z.string().min(1),
    nodes: z.array(NodeSchema).min(1),
    edges: z.array(EdgeSchema),
    triggers: z.array(TriggerSchema),
  })
  .superRefine((wf, ctx) => {
    const ids = new Set(wf.nodes.map((n) => n.id));
    wf.edges.forEach((e, i) => {
      if (!ids.has(e.from)) {
        ctx.addIssue({ code: 'custom', path: ['edges', i, 'from'], message: 'unknown node' });
      }
      if (!ids.has(e.to)) {
        ctx.addIssue({ code: 'custom', path: ['edges', i, 'to'], message: 'unknown node' });
      }
    });
  });

export type Workflow = z.infer<typeof WorkflowSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Trigger = z.infer<typeof TriggerSchema>;
export const NODE_TYPE_LIST = NODE_TYPES;
