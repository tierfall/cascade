# ADR 0011: Synchronized versioning via Nx/Changesets `fixed` mode

**Status:** Accepted (2026-05-22)
**Spec reference:** §10.2

## Context

Seven publishable packages (`@tierfall/cascade-*`) plus three Docker images. Self-hosters
need to reason about compatibility: which CLI works with which API works with which web image?

## Decision

Synchronized via Nx release `fixed` mode. `git tag v0.1.0` → every package at `0.1.0`,
every Docker image tagged `:0.1.0`. Revisit post-v1.0 when the ecosystem stabilizes;
switching to independent is a Changesets config flag.

## Consequences

- Simple mental model during the formative period.
- Some packages bump for changes they didn't have — minor noise in npm.

## Alternatives considered

- **Independent per-package semver from v0.1** — compatibility-matrix overhead too high
  for the v0.1 user.
- **Synchronized permanently** — never split, even at v1.0; lock-in too rigid for mature OSS.
