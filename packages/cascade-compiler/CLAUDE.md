# cascade-compiler — Claude context

**Purpose:** Graph → TypeScript compiler. v0.1 ships a trivial passthrough emitter:
the generated `.ts` file imports `@tierfall/cascade-sdk` and re-triggers the workflow
via the API. v0.3 lands the real compiler that inlines each node's logic.

## What lives here

- `src/compile.ts` — public entry. Validates with the WorkflowSchema, then emits.
- `src/emit.ts` — the actual code generator. Currently a single template.

## Why it exists (load-bearing per spec §1)

The compile-to-TypeScript exit door is the lock-in protection. Even at v0.1 — where
the emitter is trivial — users can already see that "every workflow is also a `.ts`
file". The schema is compiler-friendly from day one (no editor-only constructs).

## Hard rules

- The emitter MUST NOT depend on cascade-api, cascade-nodes, or any server-side code.
  It only consumes Workflow JSON + the SDK.
- 95% coverage threshold.
- When the v0.3 compiler arrives, the v0.1 trivial output remains valid — it's just
  superseded by a richer version.
