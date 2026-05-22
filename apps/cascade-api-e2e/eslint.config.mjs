import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // e2e spec files import NestJS app code via relative paths; ESLint's project service
    // cannot always resolve cross-package types from pnpm's strict hoist. Disable the
    // type-aware unsafe rules here — correctness is enforced by the tests themselves.
    files: ['src/**/*.e2e-spec.ts', 'src/containers.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
];
