#!/usr/bin/env node
import { execSync } from 'node:child_process';

const lintTargets = [
  'packages/cascade-tokens/src',
  'packages/cascade-core/src',
  'packages/cascade-sdk/src',
];

console.log('==> ESLint: platform-neutral import boundary');
execSync(`pnpm exec eslint --max-warnings=0 ${lintTargets.join(' ')}`, { stdio: 'inherit' });

console.log('==> tsc: RN-target build (lib excludes DOM)');
execSync('pnpm exec tsc --project tools/rn-target-tsconfig.json', { stdio: 'inherit' });

console.log('platform-neutral boundary OK');
