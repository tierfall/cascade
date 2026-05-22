import { conditionalHandler } from './node-types/conditional.js';
import { httpHandler } from './node-types/http.js';
import { llmHandler } from './node-types/llm.js';
import { transformHandler } from './node-types/transform.js';
import type { NodeHandler } from './types.js';

export const nodeRegistry = {
  llm: llmHandler,
  conditional: conditionalHandler,
  transform: transformHandler,
  http: httpHandler,
} as const;

export const NODE_TYPE_KEYS = ['llm', 'conditional', 'transform', 'http'] as const;
export type NodeTypeKey = (typeof NODE_TYPE_KEYS)[number];

export function getNodeHandler(type: NodeTypeKey): NodeHandler {
  // Cast through Record so TS allows the undefined check at runtime (callers may
  // pass an untyped string that slips past the NodeTypeKey annotation).
  const registry: Record<string, NodeHandler | undefined> = nodeRegistry;
  const handler = registry[type];
  if (!handler) throw new Error(`unknown node type: ${type}`);
  return handler;
}
