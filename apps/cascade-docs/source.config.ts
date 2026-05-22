import { defineConfig, defineDocs } from 'fumadocs-mdx/config';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const { docs, meta } = defineDocs({ dir: 'content/docs' }) as any;

export default defineConfig();
