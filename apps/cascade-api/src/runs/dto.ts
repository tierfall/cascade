import { z } from 'zod';

export const TriggerRunBodySchema = z
  .object({
    input: z.record(z.unknown()).optional(),
  })
  .strict();

export const ListRunsQuerySchema = z
  .object({
    workflowId: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type TriggerRunBody = z.infer<typeof TriggerRunBodySchema>;
export type ListRunsQuery = z.infer<typeof ListRunsQuerySchema>;
