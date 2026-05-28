import { CascadeApiError } from './errors.js';
import type { ClientOptions, HealthResponse, RunSummary, TriggerInput, Workflow } from './types.js';

export class CascadeClient {
  private readonly baseUrl: string;
  private readonly apiToken?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    if (opts.apiToken !== undefined) this.apiToken = opts.apiToken;
    this.fetchImpl = opts.fetch ?? globalThis.fetch;
  }

  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('GET', '/health');
  }

  async listWorkflows(): Promise<Workflow[]> {
    return this.request<Workflow[]>('GET', '/workflows');
  }

  async triggerWorkflow(workflowId: string, input: TriggerInput): Promise<RunSummary> {
    return this.request<RunSummary>('POST', `/workflows/${workflowId}/runs`, input);
  }

  async getRun(runId: string): Promise<RunSummary> {
    return this.request<RunSummary>('GET', `/runs/${runId}`);
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiToken !== undefined) headers.Authorization = `Bearer ${this.apiToken}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const init: RequestInit = { method, headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, init);
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      throw new CascadeApiError(`expected JSON, got ${contentType}`, response.status);
    }
    const data = await response.json();
    if (!response.ok) {
      throw new CascadeApiError(`HTTP ${String(response.status)}`, response.status, data);
    }
    return data as T;
  }
}
