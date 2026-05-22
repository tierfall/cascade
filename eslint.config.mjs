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
      // fumadocs-mdx processes source.config.ts with its own transpiler; excluding from
      // project-service lint avoids ZodTypeAny "cannot be named" false positives.
      'apps/cascade-docs/source.config.ts',
      // next.config.mjs uses import.meta + node:url helpers — not a TS project file.
      'apps/cascade-docs/next.config.mjs',
      'apps/cascade-api/prisma/generated/**',
      // Nx-generated webpack/next/postcss configs use CJS require/module — ignore for now.
      'apps/cascade-api/webpack.config.js',
      'apps/cascade-web/next.config.js',
      'apps/cascade-web/postcss.config.js',
      // Expo's babel config uses CJS module.exports — not a TS project file.
      'apps/cascade-mobile/babel.config.js',
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
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/test/**/*.ts', '**/test/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/dot-notation': 'off',
    },
  },
  {
    files: ['packages/cascade-cli/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  // cascade-docs uses fumadocs-mdx@11.x whose type system leaks ZodTypeAny and
  // any-typed intermediates through the loader() → createMDXSource() chain. The
  // runtime behaviour is correct — relax the unsafe-* rules for this package only.
  {
    files: ['apps/cascade-docs/**/*.ts', 'apps/cascade-docs/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
  // NestJS apps use empty decorated classes (@Module, @Controller) as module containers.
  // The no-extraneous-class rule must allow decorated classes for these apps.
  {
    files: ['apps/cascade-api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
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
            {
              name: 'child_process',
              message: 'platform-neutral packages cannot import node:child_process',
            },
          ],
          patterns: [
            {
              group: ['node:*'],
              message: 'platform-neutral packages cannot import node:* modules',
            },
            {
              group: ['react-native', 'react-native/*'],
              message: 'tokens/core/sdk must be cross-platform; do not import RN here',
            },
            { group: ['@nestjs/*'], message: 'platform-neutral packages cannot import NestJS' },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'platform-neutral packages cannot reference window' },
        { name: 'document', message: 'platform-neutral packages cannot reference document' },
        { name: 'navigator', message: 'platform-neutral packages cannot reference navigator' },
        {
          name: '__dirname',
          message: 'platform-neutral packages cannot reference __dirname (Node-only)',
        },
        {
          name: '__filename',
          message: 'platform-neutral packages cannot reference __filename (Node-only)',
        },
      ],
    },
  },
);
