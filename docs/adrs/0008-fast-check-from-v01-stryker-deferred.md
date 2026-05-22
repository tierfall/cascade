# ADR 0008: fast-check from v0.1, Stryker deferred

**Status:** Accepted (2026-05-22)
**Spec reference:** §4.4

## Context

Coverage gates alone don't answer "do my tests actually catch bugs". Two augmentations
exist: property-based tests (fast-check) and mutation testing (Stryker). Both useful;
both have CI cost.

## Decision

- **fast-check from v0.1** for `cascade-core` pure functions (graph utilities, schema
  rejection paths). Cheap to wire; big payoff on the constraint-#18 edge-case requirement.
- **Stryker deferred to v0.2+.** Tracked as a Backlog issue. The 30+ minute mutation runs
  would dominate scaffolding-phase CI; revisit once the suite stabilizes.

## Consequences

- v0.1 ships generative tests where they pay off most.
- Stryker's "are these tests load-bearing?" signal arrives in v0.2.

## Alternatives considered

- **Both from v0.1** — too much CI weight during scaffolding.
- **Both deferred** — loses fast-check's cheap edge-case payoff in cascade-core.
