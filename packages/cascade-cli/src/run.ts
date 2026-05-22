import { CascadeClient } from '@tierfall/cascade-sdk';

export interface RunOptions {
  workflowId: string;
  apiUrl: string;
  apiToken?: string;
  input?: Record<string, unknown>;
  wait: boolean;
}

export type Logger = (message: string) => void;

export async function runCommand(opts: RunOptions, log: Logger): Promise<void> {
  const client = new CascadeClient({
    baseUrl: opts.apiUrl,
    ...(opts.apiToken !== undefined ? { apiToken: opts.apiToken } : {}),
  });
  const run = await client.triggerWorkflow(
    opts.workflowId,
    opts.input !== undefined ? { input: opts.input } : {},
  );
  log(`Triggered ${opts.workflowId} -> run id ${run.id} (status: ${run.status})`);
  if (opts.wait) {
    log('Note: --wait polling is a backlog issue (B-CLI-WAIT) — exiting without blocking.');
  }
}
