import { z } from 'zod';

export const SetupBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(12),
  })
  .strict();

export type SetupBody = z.infer<typeof SetupBodySchema>;
