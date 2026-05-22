# cascade-web — Claude context

**Purpose:** Next.js 15 frontend. v0.1 is **read-only** — renders workflow graphs
from the API, shows live execution feedback via WebSocket. Editing arrives in v0.2.

## What lives here

- `app/layout.tsx` — root layout. Dark mode by default (spec §6.3). Fonts applied
  via Tailwind's `font-sans` resolving to Inter (cascade-tokens).
- `app/page.tsx` — landing page. Shows the tier ramp and a CTA.
- `tailwind.config.ts` — extends `@tierfall/cascade-ui/tailwind-preset`. Adds the
  `cascade-ui` source path so the preset's classes are tree-shaken correctly.
- Future (each landed as a v0.1 backlog issue):
  - `app/workflows/page.tsx` — list view.
  - `app/workflows/[id]/page.tsx` — read-only graph view consuming ReactFlow 12 (@xyflow/react).
  - `lib/state/canvasStore.ts` — Zustand store for ReactFlow state.
  - `lib/state/runStore.ts` — Zustand store subscribed to Socket.IO node-execution events.
  - `app/setup/page.tsx` — first-boot setup wizard (spec §5.4).

## Hard rules

- 90% coverage threshold. `layout.tsx`, `page.tsx`, `route.ts` excluded from unit
  collection — those are covered by Playwright in cascade-web-e2e (Task 16).
- No hardcoded colors / spacing / typography. Everything routes through the preset.
- Read-only in v0.1. The visual editor (drag-drop, edit-on-canvas, per-node policy)
  is the v0.2 milestone. Build the schema-version=`1.0.0` reader carefully — v0.2
  must extend it, not replace it.
