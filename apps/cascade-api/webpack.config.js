const { composePlugins, withNx } = require('@nx/webpack');
const webpack = require('webpack');

// Nx plugins for webpack.
module.exports = composePlugins(
  withNx({
    target: 'node',
  }),
  (config) => {
    // Resolve TS-source ESM .js extension imports (e.g. `import './foo.js'`
    // that actually live on disk as `./foo.ts`).
    config.resolve = config.resolve || {};
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.js'],
      ...( config.resolve.extensionAlias || {} ),
    };

    // Suppress "Module not found" errors for NestJS optional peer deps that
    // are never actually loaded in this app (no websockets, no microservices,
    // no platform-express in this project).
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/microservices',
            '@nestjs/microservices/microservices-module',
            '@nestjs/websockets',
            '@nestjs/websockets/socket-module',
            '@nestjs/platform-express',
            'class-validator',
            'class-transformer',
          ];
          if (!lazyImports.includes(resource)) return false;
          try {
            require.resolve(resource, { paths: [__dirname] });
          } catch {
            return true; // not installed — ignore the import
          }
          return false;
        },
      }),
    );

    return config;
  },
);
