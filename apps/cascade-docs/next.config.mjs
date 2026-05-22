import { createMDX } from 'fumadocs-mdx/next';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  output: 'standalone',
  webpack(cfg) {
    // TypeScript source files use `.js` extension imports (ESM style).
    // Webpack doesn't resolve `.js` → `.tsx/.ts` by default.
    cfg.resolve.extensionAlias = {
      ...cfg.resolve.extensionAlias,
      '.js': ['.tsx', '.ts', '.js'],
    };
    // `@` alias points to the project root so `@/.source` resolves correctly.
    cfg.resolve.alias = {
      ...cfg.resolve.alias,
      '@': resolve(__dirname),
    };
    return cfg;
  },
};

export default withMDX(config);
