//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: false,
  },
  webpack(config) {
    // When @nx/next auto-adds workspace packages to transpilePackages, the TypeScript
    // source files use `.js` extension imports (ESM style). Webpack doesn't resolve
    // `.js` → `.tsx/.ts` by default, so we add that mapping here.
    config.resolve.extensionAlias = {
      ...config.resolve.extensionAlias,
      '.js': ['.tsx', '.ts', '.js'],
    };
    return config;
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

module.exports = composePlugins(...plugins)(nextConfig);
