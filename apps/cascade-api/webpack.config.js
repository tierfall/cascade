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
      ...(config.resolve.extensionAlias || {}),
    };

    // argon2 ships a .node native binding that cannot be webpacked. Keep it as a
    // runtime require resolved from node_modules in the Docker runner (the
    // Dockerfile copies the workspace node_modules into the final stage).
    const argon2External = { argon2: 'commonjs argon2' };
    if (Array.isArray(config.externals)) {
      config.externals.push(argon2External);
    } else if (typeof config.externals === 'object' && config.externals !== null) {
      config.externals = [config.externals, argon2External];
    } else {
      config.externals = [argon2External];
    }

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
            // @nestjs/mapped-types pokes at class-transformer/{storage,cjs/storage}
            // at load time even though we never call ApiProperty with a transform.
            'class-transformer/storage',
            'class-transformer/cjs/storage',
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
