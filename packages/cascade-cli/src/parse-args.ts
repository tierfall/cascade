export interface ParsedArgs {
  command: 'run';
  workflowId: string;
  apiUrl?: string;
  apiToken?: string;
  input?: Record<string, unknown>;
  wait: boolean;
  pollIntervalMs?: number;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
  if (argv.length === 0) throw new Error('command required');
  const [cmd, ...rest] = argv;
  if (cmd !== 'run') throw new Error(`unknown command: ${String(cmd)}`);
  if (rest.length === 0 || rest[0] === undefined || rest[0].startsWith('--')) {
    throw new Error('workflow id required');
  }
  const result: ParsedArgs = { command: 'run', workflowId: rest[0], wait: false };
  for (let i = 1; i < rest.length; i += 1) {
    const flag = rest[i];
    if (flag === '--wait') {
      result.wait = true;
      continue;
    }
    const value = rest[i + 1];
    if (value === undefined) throw new Error(`flag ${String(flag)} requires a value`);
    switch (flag) {
      case '--api-url':
        result.apiUrl = value;
        break;
      case '--api-token':
        result.apiToken = value;
        break;
      case '--input':
        try {
          result.input = JSON.parse(value) as Record<string, unknown>;
        } catch {
          throw new Error('invalid JSON for --input');
        }
        break;
      case '--poll-interval': {
        const n = Number(value);
        if (!Number.isFinite(n) || n <= 0) {
          throw new Error('--poll-interval must be a positive number (milliseconds)');
        }
        result.pollIntervalMs = n;
        break;
      }
      default:
        throw new Error(`unknown flag: ${String(flag)}`);
    }
    i += 1;
  }
  return result;
}
