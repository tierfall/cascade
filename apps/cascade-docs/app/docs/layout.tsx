import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { source } from '../../lib/source.js';

export default function Layout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{ title: 'Cascade', url: '/docs' }}
      sidebar={{ defaultOpenLevel: 1 }}
    >
      {children}
    </DocsLayout>
  );
}
