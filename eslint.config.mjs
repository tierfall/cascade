// @ts-check
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/.nx/**',
      '**/.next/**',
      '**/node_modules/**',
      '**/.husky/_/**',
      '.claude/**',
      '**/.expo/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'apps/cascade-docs/.source/**',
      'apps/cascade-api/prisma/generated/**',
    ],
  },
  eslint.configs.recommended,
  eslintComments.recommended,
  prettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': true, 'ts-nocheck': true, 'ts-check': false },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    rules: {
      '@eslint-community/eslint-comments/no-use': ['error', { allow: [] }],
      '@eslint-community/eslint-comments/no-unused-disable': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  {
    files: ['packages/cascade-cli/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  // Platform-neutral packages: ban DOM/Node/React imports.
  // Enforces spec §3.2: cascade-tokens, cascade-core, cascade-sdk must remain pure TS
  // with zero web- or Node-only dependencies.
  {
    files: [
      'packages/cascade-tokens/src/**/*.ts',
      'packages/cascade-core/src/**/*.ts',
      'packages/cascade-sdk/src/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'react', message: 'platform-neutral packages cannot import react' },
            { name: 'react-dom', message: 'platform-neutral packages cannot import react-dom' },
            { name: 'next', message: 'platform-neutral packages cannot import next' },
            { name: 'next/server', message: 'platform-neutral packages cannot import next' },
            { name: 'fs', message: 'platform-neutral packages cannot import node:fs' },
            { name: 'path', message: 'platform-neutral packages cannot import node:path' },
            { name: 'process', message: 'platform-neutral packages cannot import node:process' },
            { name: 'child_process', message: 'platform-neutral packages cannot import node:child_process' },
          ],
          patterns: [
            { group: ['node:*'], message: 'platform-neutral packages cannot import node:* modules' },
            { group: ['react-native', 'react-native/*'], message: 'tokens/core/sdk must be cross-platform; do not import RN here' },
            { group: ['@nestjs/*'], message: 'platform-neutral packages cannot import NestJS' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'platform-neutral packages cannot reference window' },
        { name: 'document', message: 'platform-neutral packages cannot reference document' },
        { name: 'navigator', message: 'platform-neutral packages cannot reference navigator' },
        { name: '__dirname', message: 'platform-neutral packages cannot reference __dirname (Node-only)' },
        { name: '__filename', message: 'platform-neutral packages cannot reference __filename (Node-only)' },
      ],
    },
  },
);
