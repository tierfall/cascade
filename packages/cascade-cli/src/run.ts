import { CascadeClient, type RunSummary } from '@tierfall/cascade-sdk';

export interface RunOptions {
  workflowId: string;
  apiUrl: string;
  apiToken?: string;
  input?: Record<string, unknown>;
  wait: boolean;
  pollIntervalMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export type Logger = (message: string) => void;

const TERMINAL_STATUSES: ReadonlySet<RunSummary['status']> = new Set(['success', 'error']);

export class RunFailedError extends Error {
  constructor(public readonly run: RunSummary) {
    super(`run ${run.id} ended with status '${run.status}'`);
    this.name = 'RunFailedError';
  }
}

const defaultSleep = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

export async function runCommand(opts: RunOptions, log: Logger): Promise<RunSummary> {
  const client = new CascadeClient({
    baseUrl: opts.apiUrl,
    ...(opts.apiToken !== undefined ? { apiToken: opts.apiToken } : {}),
  });
  const run = await client.triggerWorkflow(
    opts.workflowId,
    opts.input !== undefined ? { input: opts.input } : {},
  );
  log(`Triggered ${opts.workflowId} -> run id ${run.id} (status: ${run.status})`);
  if (!opts.wait) return run;

  const pollIntervalMs = opts.pollIntervalMs ?? 1000;
  const sleep = opts.sleep ?? defaultSleep;
  let current: RunSummary = run;
  while (!TERMINAL_STATUSES.has(current.status)) {
    await sleep(pollIntervalMs);
    current = await client.getRun(run.id);
    log(`run ${current.id} status: ${current.status}`);
  }
  if (current.status === 'error') {
    throw new RunFailedError(current);
  }
  return current;
}
