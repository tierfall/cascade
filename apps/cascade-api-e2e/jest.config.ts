import type { Config } from 'jest';
import path from 'node:path';

// Resolve NestJS packages from cascade-api's node_modules so that the same
// singleton instance (same rxjs peer) is used for both the app under test and
// the test bootstrap code. pnpm strict hoisting can otherwise create two copies
// of @nestjs/common that differ only in their resolved rxjs peer version,
// causing decorator registration to silently fail.
const cascadeApiNodeModules = path.resolve(__dirname, '../cascade-api/node_modules');

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.e2e-spec.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  modulePaths: [cascadeApiNodeModules],
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
        },
      },
    ],
  },
  testTimeout: 120_000, // Testcontainers spin-up is slow on first run
};

export default config;
