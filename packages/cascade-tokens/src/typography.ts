export const typography = Object.freeze({
  fontFamily: Object.freeze({
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    serif: 'ui-serif, Georgia, serif',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, monospace',
  } as const),
  fontSize: Object.freeze({
    caption: '0.75rem',
    body: '1rem',
    h3: '1.25rem',
    h2: '1.5rem',
    h1: '2rem',
    display: '3rem',
  } as const),
  fontWeight: Object.freeze({
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  } as const),
  lineHeight: Object.freeze({
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  } as const),
});
