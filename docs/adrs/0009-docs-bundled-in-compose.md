# ADR 0009: Docs bundled in the Docker compose stack

**Status:** Accepted (2026-05-22)
**Spec reference:** §5.2

## Context

Self-hosters may run Cascade air-gapped. If docs only live on Vercel, a self-hosted
deployment loses access to its own documentation.

## Decision

`apps/cascade-docs` runs inside the compose stack at port 3001 (host-mapped to
`CASCADE_DOCS_PORT`, default 3002). Vercel public deploy is a v0.x cleanup item;
NO Vercel-specific code in the repo (Fumadocs static export is platform-agnostic).

## Consequences

- Docs reachable on first boot, even without internet.
- Compose stack is one container heavier (small image).

## Alternatives considered

- **Vercel only** — breaks air-gapped use cases.
- **Both from day one** — twice the release surface in v0.1; not justified by user demand.
