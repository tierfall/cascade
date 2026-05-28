import { DEFAULT_RUN_LIMITS, LimitExceededError, RunLimitsService } from './run-limits.js';

function withEnv<T>(overrides: Record<string, string | undefined>, fn: () => T): T {
  const originals = new Map<string, string | undefined>();
  for (const [k, v] of Object.entries(overrides)) {
    originals.set(k, process.env[k]);
    if (v === undefined) {
      process.env[k] = '';
    } else {
      process.env[k] = v;
    }
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of originals) {
      if (v === undefined) {
        process.env[k] = '';
      } else {
        process.env[k] = v;
      }
    }
  }
}

describe('RunLimitsService', () => {
  describe('constructor', () => {
    it('returns DEFAULT_RUN_LIMITS when no env vars are set', () => {
      const service = withEnv(
        {
          CASCADE_MAX_NODES_PER_RUN: undefined,
          CASCADE_MAX_RUN_DURATION_MS: undefined,
          CASCADE_MAX_RUN_COST_USD: undefined,
          CASCADE_MAX_NODE_RETRIES: undefined,
        },
        () => new RunLimitsService(),
      );
      expect(service.get()).toEqual(DEFAULT_RUN_LIMITS);
    });

    it('parses overrides from env vars', () => {
      const service = withEnv(
        {
          CASCADE_MAX_NODES_PER_RUN: '50',
          CASCADE_MAX_RUN_DURATION_MS: '10000',
          CASCADE_MAX_RUN_COST_USD: '0.25',
          CASCADE_MAX_NODE_RETRIES: '1',
        },
        () => new RunLimitsService(),
      );
      const limits = service.get();
      expect(limits.maxNodesPerRun).toBe(50);
      expect(limits.maxRunDurationMs).toBe(10000);
      expect(limits.maxRunCostUsd).toBe(0.25);
      expect(limits.maxNodeRetries).toBe(1);
    });

    it('rejects non-integer for CASCADE_MAX_NODES_PER_RUN', () => {
      expect(() =>
        withEnv({ CASCADE_MAX_NODES_PER_RUN: '50.5' }, () => new RunLimitsService()),
      ).toThrow(/positive integer/);
    });

    it('rejects negative for CASCADE_MAX_RUN_DURATION_MS', () => {
      expect(() =>
        withEnv({ CASCADE_MAX_RUN_DURATION_MS: '-1' }, () => new RunLimitsService()),
      ).toThrow(/positive integer/);
    });

    it('rejects non-number for CASCADE_MAX_RUN_COST_USD', () => {
      expect(() =>
        withEnv({ CASCADE_MAX_RUN_COST_USD: 'free' }, () => new RunLimitsService()),
      ).toThrow(/positive number/);
    });

    it('returns a frozen limits object', () => {
      const limits = new RunLimitsService().get();
      expect(Object.isFrozen(limits)).toBe(true);
    });
  });

  describe('checks', () => {
    const service = new RunLimitsService();

    it('checkNodeCount throws at the max, passes below', () => {
      expect(() => {
        service.checkNodeCount(0);
      }).not.toThrow();
      expect(() => {
        service.checkNodeCount(service.get().maxNodesPerRun);
      }).toThrow(LimitExceededError);
    });

    it('checkDuration throws at the max, passes below', () => {
      expect(() => {
        service.checkDuration(0);
      }).not.toThrow();
      expect(() => {
        service.checkDuration(service.get().maxRunDurationMs);
      }).toThrow(LimitExceededError);
    });

    it('checkCost throws above the max, passes at or below', () => {
      expect(() => {
        service.checkCost(service.get().maxRunCostUsd);
      }).not.toThrow();
      expect(() => {
        service.checkCost(service.get().maxRunCostUsd + 0.01);
      }).toThrow(LimitExceededError);
    });

    it('checkRetries throws above the max, passes at or below', () => {
      expect(() => {
        service.checkRetries(service.get().maxNodeRetries);
      }).not.toThrow();
      expect(() => {
        service.checkRetries(service.get().maxNodeRetries + 1);
      }).toThrow(LimitExceededError);
    });

    it('LimitExceededError carries the limit name + offending value', () => {
      try {
        service.checkNodeCount(service.get().maxNodesPerRun + 100);
        fail('expected to throw');
      } catch (err) {
        expect(err).toBeInstanceOf(LimitExceededError);
        const e = err as LimitExceededError;
        expect(e.limit).toBe('maxNodesPerRun');
        expect(e.value).toBe(service.get().maxNodesPerRun + 100);
      }
    });
  });
});
