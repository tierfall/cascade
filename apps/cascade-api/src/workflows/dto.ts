import { WorkflowSchema } from '@tierfall/cascade-core';
import { z } from 'zod';

export const CreateWorkflowBodySchema = WorkflowSchema;

export const UpdateWorkflowBodySchema = z
  .object({
    name: z.string().min(1).optional(),
    definition: WorkflowSchema.optional(),
  })
  .strict()
  .refine((v) => v.name !== undefined || v.definition !== undefined, {
    message: 'at least one of name, definition must be provided',
  });

export const ListQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict();

export type CreateWorkflowBody = z.infer<typeof CreateWorkflowBodySchema>;
export type UpdateWorkflowBody = z.infer<typeof UpdateWorkflowBodySchema>;
export type ListQuery = z.infer<typeof ListQuerySchema>;
