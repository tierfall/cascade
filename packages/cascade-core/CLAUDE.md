# cascade-core — Claude context

**Purpose:** Public-API shared types for Cascade. Workflow JSON schema (the v0.1
public contract), graph utilities, tier-policy types. Platform-neutral pure TS.

## What lives here

- `src/workflow-schema.ts` — Zod schema for Workflow + node/edge/trigger discriminated unions.
  This is the v0.1 schema-version=`1.0.0` contract. Breaking changes require a schema-version bump
  AND a migration plan in `docs/adrs/`.
- `src/graph.ts` — pure graph utilities: `hasCycle`, `topologicalSort`, `reachableFrom`.
- `src/tier-policy.ts` — `TierPolicy` type + `defaultPolicy` + `mergePolicy`. Maps to TierFall's
  routing semantics — keep aligned with `@tierfall/core` upstream.
- `src/errors.ts` — `WorkflowValidationError`, `CycleDetectedError`. Both are typed; consumers
  pattern-match by `instanceof`.

## Consumers

- `cascade-api` — validates incoming workflow JSON, enforces schema-version on disk.
- `cascade-compiler` — reads validated workflows and emits TypeScript.
- `cascade-cli` — uses `topologicalSort` to dry-run.
- `cascade-sdk` — re-exports `Workflow` and `TierPolicy` types for clients.
- `cascade-nodes` — references `NODE_TYPE_LIST` to gate registry entries.

## Hard rules

- Platform-neutral. NO `react`, `react-dom`, `next`, `node:*`. Enforced in Task 7.
- 100% coverage threshold. fast-check property tests cover the graph utilities AND the
  workflow schema's rejection paths.
- The Zod schema IS the public API. Schema-version changes are semver-breaking on this package.
