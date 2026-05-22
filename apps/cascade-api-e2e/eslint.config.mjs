import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // e2e support files are Nx-generated jest globalSetup/teardown stubs that use CJS
    // module.exports syntax and eslint-disable comments. Relax rules for these files.
    files: ['src/support/*.ts'],
    rules: {
      '@eslint-community/eslint-comments/no-use': 'off',
      '@eslint-community/eslint-comments/disable-enable-pair': 'off',
      '@eslint-community/eslint-comments/no-unlimited-disable': 'off',
    },
  },
];
