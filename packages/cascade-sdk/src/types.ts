import type { Workflow } from '@tierfall/cascade-core';

export type { Workflow };

export interface HealthResponse {
  status: 'ok' | 'degraded';
}

export interface RunSummary {
  id: string;
  status: 'queued' | 'running' | 'success' | 'error';
  workflowId: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface TriggerInput {
  input?: Record<string, unknown>;
}

export interface ClientOptions {
  baseUrl: string;
  apiToken?: string;
  fetch?: typeof fetch;
}
