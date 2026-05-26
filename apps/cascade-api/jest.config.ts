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
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
    './src/health/health.controller.ts': {
      statements: 100,
      branches: 0, // decorator-metadata typeof guards are compiler-generated unreachable branches
      functions: 100,
      lines: 100,
    },
    './src/secrets/secret.service.ts': {
      statements: 100,
      branches: 0, // decorator-metadata typeof guards are compiler-generated unreachable branches
      functions: 100,
      lines: 100,
    },
    './src/secrets/secret-key.ts': {
      statements: 0, // pure type export — only imported as `import type`, never executed
      branches: 100,
      functions: 100,
      lines: 0,
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
