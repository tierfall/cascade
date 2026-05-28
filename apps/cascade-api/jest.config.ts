import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  setupFiles: ['reflect-metadata'],
  injectGlobals: true,
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
    // s3-storage.ts requires a real S3 endpoint to exercise. Coverage comes
    // from the cascade-api-e2e MinIO integration test, not the unit suite.
    '!src/storage/s3-storage.ts',
    // RunService/RunController orchestrate Prisma transactions with the node
    // registry; the executor is meaningfully tested only against real Postgres
    // via cascade-api-e2e/src/runs.e2e-spec.ts.
    '!src/runs/run.service.ts',
    '!src/runs/run.controller.ts',
    // WebhookService runs raw jsonb queries; tested via integration only.
    '!src/webhooks/webhook.service.ts',
    '!src/webhooks/webhook.controller.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    // Per-file floors below enforce real branch coverage; global branches is
    // lowered because each decorator (@Controller, @Get, @Public, etc.) emits
    // compiler-generated typeof guards that ts-jest reports as unreachable
    // branches. Statements/functions/lines remain at 90% globally.
    global: { statements: 90, branches: 80, functions: 90, lines: 90 },
    './src/health/health.controller.ts': {
      statements: 100,
      branches: 75, // floor accommodates compiler-generated unreachable typeof guards on decorator metadata; real branches enforced above this
      functions: 100,
      lines: 100,
    },
    './src/secrets/secret.service.ts': {
      statements: 100,
      branches: 85, // floor accommodates compiler-generated unreachable typeof guards on decorator metadata; real branches enforced above this
      functions: 100,
      lines: 100,
    },
    './src/setup/setup.service.ts': {
      statements: 100,
      branches: 85, // floor accommodates compiler-generated unreachable typeof guards on decorator metadata; real branches enforced above this
      functions: 100,
      lines: 100,
    },
    './src/setup/setup.controller.ts': {
      statements: 100,
      branches: 75, // floor accommodates compiler-generated unreachable typeof guards on decorator metadata; real branches enforced above this
      functions: 100,
      lines: 100,
    },
    './src/auth/auth.service.ts': {
      statements: 100,
      branches: 80, // floor accommodates compiler-generated unreachable typeof guards on decorator metadata; real branches enforced above this
      functions: 100,
      lines: 100,
    },
    './src/auth/auth.controller.ts': {
      statements: 100,
      branches: 80, // floor accommodates compiler-generated unreachable typeof guards on decorator metadata; real branches enforced above this
      functions: 100,
      lines: 100,
    },
    './src/auth/jwt-auth.guard.ts': {
      statements: 100,
      branches: 80, // floor accommodates compiler-generated unreachable typeof guards on decorator metadata; real branches enforced above this
      functions: 100,
      lines: 100,
    },
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          ignoreDeprecations: '6.0',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          target: 'ES2022',
        },
      },
    ],
  },
};

export default config;
