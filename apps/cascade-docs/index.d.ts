declare module '*.svg' {
  import type { FunctionComponent, SVGProps } from 'react';
  const content: string;
  export const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default content;
}

// Allow side-effect CSS imports (e.g. fumadocs-ui/style.css)
declare module '*.css' {}
