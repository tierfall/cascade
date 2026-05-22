import { docs, meta } from '@/.source';
import type { PageTree } from 'fumadocs-core/server';
import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';

// Minimal shape needed by consumers. The fumadocs-mdx loader return type contains
// ZodTypeAny references that cannot be serialized as declarations in isolatedModules
// mode. Casting through unknown to this minimal interface is the pragmatic workaround
// for fumadocs-mdx@11.x + TypeScript@6 strict mode.
interface DocSource {
  pageTree: PageTree.Root;
  getPage: (slugs: string[] | undefined) => { data: Record<string, unknown> } | undefined;
  generateParams: () => { slug?: string[] }[];
}

export const source = loader({
  baseUrl: '/docs',
  source: createMDXSource(docs, meta),
}) as unknown as DocSource;
