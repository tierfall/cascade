import type { TableOfContents } from 'fumadocs-core/server';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import type { MDXProps } from 'mdx/types';
import { notFound } from 'next/navigation';
import { source } from '../../../lib/source.js';

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

// Fumadocs MDX page data shape — matches the runtime object produced by toRuntime().
interface DocPageData {
  title: string;
  description?: string;
  body: (props: MDXProps) => React.ReactElement;
  toc: TableOfContents;
  full?: boolean;
}

function assertDocPage(data: Record<string, unknown>): DocPageData {
  return data as unknown as DocPageData;
}

export default async function Page({ params }: PageProps): Promise<React.ReactElement> {
  const resolved = await params;
  const page = source.getPage(resolved.slug);
  if (!page) notFound();

  const d = assertDocPage(page.data);
  const MDX = d.body;
  const fullProp = d.full === true ? { full: true as const } : {};
  return (
    <DocsPage toc={d.toc} {...fullProp}>
      <DocsTitle>{d.title}</DocsTitle>
      <DocsDescription>{d.description}</DocsDescription>
      <DocsBody>
        <MDX />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams(): { slug?: string[] }[] {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<{ title?: string; description?: string }> {
  const resolved = await params;
  const page = source.getPage(resolved.slug);
  if (!page) return {};
  const d = assertDocPage(page.data);
  return {
    ...(d.title && { title: d.title }),
    ...(d.description && { description: d.description }),
  };
}
