# cascade-sdk — Claude context

**Purpose:** Typed fetch-based client for the Cascade HTTP API. Platform-neutral —
the same module runs in Node 24, Bun, Deno, browsers, and React Native.

## What lives here

- `src/client.ts` — `CascadeClient` class with `health`, `listWorkflows`, `triggerWorkflow`.
  More methods land as new API endpoints are added (one PR per endpoint pair).
- `src/types.ts` — request/response types. Re-exports `Workflow` from `@tierfall/cascade-core`
  so SDK consumers don't have to import two packages for the basic types.
- `src/errors.ts` — `CascadeApiError`. Consumers `instanceof`-check.

## Consumers

- `apps/cascade-web` — UI calls the API through this client.
- `apps/cascade-mobile` — RN-boundary smoke test imports this to prove portability.
- `packages/cascade-cli` — uses this for `cascade run`.
- Third-party scripts via `npm install @tierfall/cascade-sdk`.

## Hard rules

- NO DOM, NO Node-only, NO React imports. Uses global `fetch` (Node 24+ has it). The
  `fetch` parameter on `ClientOptions` lets tests inject a mock without polyfills.
- 100% coverage threshold.
- Every method returns a fully-typed result; we never expose untyped responses to consumers.
