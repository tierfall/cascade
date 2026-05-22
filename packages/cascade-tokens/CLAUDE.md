# cascade-tokens — Claude context

**Purpose:** Single source of truth for Cascade's visual language. Pure TypeScript;
no DOM, no React, no Node-only imports.

## What lives here

- `src/colors.ts` — tier ramp + neutral/semantic palettes (light + dark)
- `src/spacing.ts` — 8-step rem scale
- `src/typography.ts` — fontFamily, fontSize, fontWeight, lineHeight
- `src/radii.ts` — border-radius ramp
- `src/motion.ts` — duration + easing tokens

All exports are deeply `Object.freeze`-d. Mutating them is a type error AND a runtime error.

## Consumers

- `packages/cascade-ui/tailwind-preset.ts` — emits Tailwind theme entries from these tokens.
- `apps/cascade-mobile/App.tsx` — consumes via inline `StyleSheet.create` (RN-boundary smoke test).
- Future `packages/cascade-ui-native/` (post-v1.0) — hand-rolled RN components.

## Hard rules

- Pure TypeScript. NO imports from `react`, `react-dom`, `next`, `node:*`, or anything else
  that wouldn't resolve in a React Native bundler. Enforced by the ESLint
  `no-restricted-imports` rule in the root `eslint.config.mjs` (added in Task 7).
- 100% coverage threshold (statements/branches/functions/lines). Drop below and `pnpm test`
  fails.
- Any new token added here MUST appear in the Tailwind preset (`cascade-ui`) within the
  same PR — that's the contract.
