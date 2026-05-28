import { type Adapter, type LLMRequest, Router } from '@tierfall/core';
import { z } from 'zod';
import type { NodeHandler, NodeResult } from '../types.js';

const ConfigSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxCostUsd: z.number().nonnegative().optional(),
  policyOverride: z.unknown().optional(),
});

type Config = z.infer<typeof ConfigSchema>;

// Adapter registry. The cascade-api process registers its configured adapters
// (Ollama / OpenAI-compatible / Anthropic) at boot via setLlmAdapters().
// Default state is empty; an empty registry returns a stub result so unit
// tests that don't care about real LLM calls keep working.
let registeredAdapters: readonly Adapter[] = [];

export function setLlmAdapters(adapters: readonly Adapter[]): void {
  registeredAdapters = adapters;
}

export function getLlmAdapters(): readonly Adapter[] {
  return registeredAdapters;
}

const TIER_TO_INDEX = {
  'premium-cloud': 3,
  'cheap-cloud': 2,
  'self-hosted-edge': 1,
  'on-device': 0,
} as const;

export const llmHandler: NodeHandler<Config> = {
  validateConfig: (config) => {
    const parsed = ConfigSchema.safeParse(config);
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, error: parsed.error };
  },
  execute: async (config, _ctx): Promise<NodeResult> => {
    const adapters = registeredAdapters;
    if (adapters.length === 0) {
      // No adapters registered — used by unit tests that don't exercise routing.
      return {
        kind: 'stub',
        output: `[llm stub — register adapters via setLlmAdapters() to route '${config.prompt.slice(0, 32)}…']`,
      };
    }
    const router = new Router(adapters);
    const request: LLMRequest = {
      model: config.model ?? 'auto',
      messages: [{ role: 'user', content: config.prompt }],
      ...(config.maxOutputTokens !== undefined ? { maxOutputTokens: config.maxOutputTokens } : {}),
      ...(config.temperature !== undefined ? { temperature: config.temperature } : {}),
      ...(config.maxCostUsd !== undefined ? { maxCostUSD: config.maxCostUsd } : {}),
    };
    const response = await router.complete(request);
    return {
      kind: 'success',
      output: {
        text: response.text,
        tier: response.tier,
        tierIndex: TIER_TO_INDEX[response.tier],
        model: response.model,
        usage: response.usage,
        fallChain: response.fallChain,
      },
    };
  },
};
