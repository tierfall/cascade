import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // NestJS @Module(), @Controller() etc. legitimately use empty decorated classes.
    // The no-extraneous-class rule must allow decorated classes project-wide.
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
  {
    // webpack.config.js is a CommonJS Node script — allow require/module globals.
    files: ['webpack.config.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'writable',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
];
