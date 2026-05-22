import { z } from 'zod';
import type { NodeHandler } from '../types.js';

const ConfigSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
});

export const httpHandler: NodeHandler<z.infer<typeof ConfigSchema>> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, error: parsed.error };
  },
  execute: async (config, _ctx) => {
    const init: RequestInit = { method: config.method };
    if (config.headers) init.headers = config.headers;
    if (config.body !== undefined) init.body = JSON.stringify(config.body);
    const response = await fetch(config.url, init);
    const contentType = response.headers.get('content-type') ?? '';
    const body: unknown = contentType.includes('application/json')
      ? await response.json()
      : await response.text();
    return { kind: 'http', status: response.status, body };
  },
};
