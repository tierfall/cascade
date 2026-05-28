import { parseArgs } from './parse-args.js';
import { RunFailedError, runCommand } from './run.js';

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h') {
    console.log(`Usage: cascade run <workflow-id> [options]

Options:
  --api-url <url>           Cascade API base URL. Defaults to env CASCADE_API_URL or http://localhost:3000.
  --api-token <token>       Bearer token. Defaults to env CASCADE_API_TOKEN.
  --input <json>            JSON payload passed as workflow input.
  --wait                    Poll until the run reaches a terminal status.
  --poll-interval <ms>      Poll interval for --wait (default 1000).
`);
    return;
  }
  const parsed = parseArgs(argv);
  const apiUrl = parsed.apiUrl ?? process.env.CASCADE_API_URL ?? 'http://localhost:3000';
  const apiToken = parsed.apiToken ?? process.env.CASCADE_API_TOKEN;
  await runCommand(
    {
      workflowId: parsed.workflowId,
      apiUrl,
      ...(apiToken !== undefined ? { apiToken } : {}),
      ...(parsed.input !== undefined ? { input: parsed.input } : {}),
      wait: parsed.wait,
      ...(parsed.pollIntervalMs !== undefined ? { pollIntervalMs: parsed.pollIntervalMs } : {}),
    },
    (m) => {
      console.log(m);
    },
  );
}

main().catch((err: unknown) => {
  if (err instanceof RunFailedError) {
    console.error(`cascade: ${err.message}`);
    process.exit(2);
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error(`cascade: ${message}`);
  process.exit(1);
});
