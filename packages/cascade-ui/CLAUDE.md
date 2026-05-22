# cascade-ui — Claude context

**Purpose:** Cascade's design system. Radix UI primitives + Tailwind classes, shadcn-style
(components owned in-repo, not imported from a third-party design system). Every class
in every component resolves to a token in `@tierfall/cascade-tokens`.

## What lives here

- `tailwind-preset.ts` — Tailwind preset consumed by `cascade-web` (and any future web app).
  Emits theme entries from `cascade-tokens` directly. New tokens MUST land in this preset
  in the same PR.
- `src/Button.tsx` — first primitive. Variants: primary / secondary / ghost. Sizes: sm / md / lg.
  Supports Radix Slot for `asChild` polymorphism.
- `src/TierBadge.tsx` — domain primitive showing a tier 0–4 badge in the appropriate ramp color.
  Throws on out-of-range tier (we catch this at the type level via the `0 | 1 | 2 | 3 | 4` union,
  but the runtime check is the safety net).
- `src/utils.ts` — `cn()` helper (clsx + tailwind-merge).

## Consumers

- `apps/cascade-web` — extends the preset in its own `tailwind.config.ts`.
- Third-party consumers via `import preset from '@tierfall/cascade-ui/tailwind-preset'`.

## Hard rules

- **No hardcoded colors or spacing in components.** All visual values go through tokens.
- **shadcn-style:** when this evolves, we copy a third-party component INTO this repo and
  adapt it; we don't `import { Button } from 'some-other-design-system'`.
- Coverage threshold 95% (spec §4.5 amended — library tier, not app tier).
- Every component is keyboard-accessible (Radix contract — we layer on top of Radix primitives,
  not below).
