/// <reference types="@testing-library/jest-dom/jest-globals" />

declare module '*.svg' {
  const content: string;
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}
