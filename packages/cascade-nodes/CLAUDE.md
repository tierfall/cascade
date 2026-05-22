# cascade-nodes — Claude context

**Purpose:** Node-type registry for Cascade. Server-side handlers + client-side metadata for
LLM, Conditional, Transform, and HTTP nodes. Tagged `scope:server`.

## What lives here

- `src/types.ts` — `NodeHandler<C>` interface (validateConfig + execute) and `NodeResult`
  discriminated union (success | branch | http | stub). `ExecutionContext` carries runId, nodeId,
  and optional input map.
- `src/registry.ts` — `nodeRegistry` const, `NODE_TYPE_KEYS` tuple, `getNodeHandler(type)`.
- `src/node-types/llm.ts` — v0.1 stub. Returns `{ kind: 'stub', output: '...' }`. Real TierFall
  wiring is tracked in backlog issue B-LLM-WIRE.
- `src/node-types/conditional.ts` — evaluates `input.X (op) literal` expressions. Supports
  `>`, `<`, `>=`, `<=`, `===`, `!==` operators. Full expression engine (jexl/expr-eval) is
  backlog issue B-COND-ENGINE.
- `src/node-types/transform.ts` — v0.1 passthrough stub. jsonata wiring is backlog issue
  B-TRANSFORM-JSONATA.
- `src/node-types/http.ts` — real fetch-based handler. Returns status + body. Does NOT throw on
  4xx/5xx — the caller decides. Validates URL syntax via Zod.

## Adding a new node type

1. Add the handler in `src/node-types/<name>.ts` implementing `NodeHandler<C>`.
2. Register it in `src/registry.ts` (add to `nodeRegistry` + `NODE_TYPE_KEYS`).
3. Export it from `src/index.ts`.
4. Add tests in `test/<name>.test.ts` maintaining the 95% branch coverage gate.

## Hard rules

- 95% coverage threshold (statements, branches, functions, lines).
- Test environment: `node`.
- Dependencies: `zod@3.24.1`, `@tierfall/cascade-core@workspace:*`, `@tierfall/core@^0.1.0`.
- `http.ts` uses global `fetch` (Node 24+). Tests mock `globalThis.fetch`.
- No DOM imports. Server-side only (`scope:server`).
