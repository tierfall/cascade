# ADR 0004: Zustand for ReactFlow canvas state

**Status:** Accepted (2026-05-22)
**Spec reference:** §6.1

## Context

ReactFlow's graph state (nodes/edges) is inherently shape-y. v0.2 brings the visual editor,
and constraint #11 requires live WebSocket-driven node-color updates without re-rendering
the whole canvas. The state library has to support efficient partial subscriptions.

## Decision

Zustand 5.x. Selector-based partial subscriptions feed only the components that care.

## Consequences

- ~1KB runtime cost.
- ReactFlow's own documentation uses Zustand — community alignment.
- Smooth path to v0.2 editor.

## Alternatives considered

- **Jotai** — atomic, but the array-shaped nodes/edges fight the atomic model.
- **Redux Toolkit** — overkill at ~12KB; devtools nice but not enough to justify the weight.
