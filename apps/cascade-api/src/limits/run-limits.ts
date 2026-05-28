import { Injectable } from '@nestjs/common';

export interface RunLimits {
  /** Maximum number of NodeExecutions allowed in a single run. */
  readonly maxNodesPerRun: number;
  /** Maximum wall-clock duration of a single run, in milliseconds. */
  readonly maxRunDurationMs: number;
  /** Maximum total LLM cost (sum of NodeExecution.costUsd) per run, in USD. */
  readonly maxRunCostUsd: number;
  /** Maximum retry attempts per node before the run fails. */
  readonly maxNodeRetries: number;
}

export const DEFAULT_RUN_LIMITS: RunLimits = Object.freeze({
  maxNodesPerRun: 1000,
  maxRunDurationMs: 5 * 60 * 1000, // 5 minutes
  maxRunCostUsd: 1.0,
  maxNodeRetries: 3,
});

export class LimitExceededError extends Error {
  constructor(
    public readonly limit: keyof RunLimits,
    public readonly value: number,
  ) {
    super(`run limit exceeded: ${limit} (value=${value.toString()})`);
    this.name = 'LimitExceededError';
  }
}

function parsePositiveInt(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.length === 0) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    throw new Error(`${name} must be a positive integer; got ${value}`);
  }
  return n;
}

function parsePositiveNumber(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value.length === 0) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${name} must be a positive number; got ${value}`);
  }
  return n;
}

@Injectable()
export class RunLimitsService {
  private readonly limits: RunLimits;

  constructor() {
    this.limits = Object.freeze({
      maxNodesPerRun: parsePositiveInt(
        process.env.CASCADE_MAX_NODES_PER_RUN,
        DEFAULT_RUN_LIMITS.maxNodesPerRun,
        'CASCADE_MAX_NODES_PER_RUN',
      ),
      maxRunDurationMs: parsePositiveInt(
        process.env.CASCADE_MAX_RUN_DURATION_MS,
        DEFAULT_RUN_LIMITS.maxRunDurationMs,
        'CASCADE_MAX_RUN_DURATION_MS',
      ),
      maxRunCostUsd: parsePositiveNumber(
        process.env.CASCADE_MAX_RUN_COST_USD,
        DEFAULT_RUN_LIMITS.maxRunCostUsd,
        'CASCADE_MAX_RUN_COST_USD',
      ),
      maxNodeRetries: parsePositiveInt(
        process.env.CASCADE_MAX_NODE_RETRIES,
        DEFAULT_RUN_LIMITS.maxNodeRetries,
        'CASCADE_MAX_NODE_RETRIES',
      ),
    });
  }

  get(): RunLimits {
    return this.limits;
  }

  /** Throws LimitExceededError if nodesExecuted >= maxNodesPerRun. */
  checkNodeCount(nodesExecuted: number): void {
    if (nodesExecuted >= this.limits.maxNodesPerRun) {
      throw new LimitExceededError('maxNodesPerRun', nodesExecuted);
    }
  }

  /** Throws LimitExceededError if elapsedMs >= maxRunDurationMs. */
  checkDuration(elapsedMs: number): void {
    if (elapsedMs >= this.limits.maxRunDurationMs) {
      throw new LimitExceededError('maxRunDurationMs', elapsedMs);
    }
  }

  /** Throws LimitExceededError if totalCostUsd > maxRunCostUsd. */
  checkCost(totalCostUsd: number): void {
    if (totalCostUsd > this.limits.maxRunCostUsd) {
      throw new LimitExceededError('maxRunCostUsd', totalCostUsd);
    }
  }

  /** Throws LimitExceededError if attempts > maxNodeRetries. */
  checkRetries(attempts: number): void {
    if (attempts > this.limits.maxNodeRetries) {
      throw new LimitExceededError('maxNodeRetries', attempts);
    }
  }
}
