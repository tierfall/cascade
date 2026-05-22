const tierRamp = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'] as const;

export const colors = Object.freeze({
  tier: Object.freeze(tierRamp),
  neutral: Object.freeze({
    background: Object.freeze({ light: '#fafafa', dark: '#0a0a0a' }),
    foreground: Object.freeze({ light: '#0a0a0a', dark: '#fafafa' }),
    border: Object.freeze({ light: '#e5e5e5', dark: '#262626' }),
    muted: Object.freeze({ light: '#737373', dark: '#a3a3a3' }),
  }),
  semantic: Object.freeze({
    success: '#22c55e',
    warning: '#eab308',
    danger: '#ef4444',
    info: '#3b82f6',
  }),
});
