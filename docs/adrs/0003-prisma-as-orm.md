# ADR 0003: Prisma as the ORM

**Status:** Accepted (2026-05-22)
**Spec reference:** §4.2

## Context

cascade-api needs an ORM that gives strict-TS types, robust migration management for
self-hosters upgrading versions, and good DX. Constraint #13 (no `@ts-ignore`, no
`eslint-disable`) eliminates ORMs that need lint suppressions to compile under
`exactOptionalPropertyTypes`.

## Decision

Prisma 6.x. Schema-first via `apps/cascade-api/prisma/schema.prisma`. `prisma migrate deploy`
on container boot.

## Consequences

- Best-in-class generated types match our strict-TS posture.
- Rock-solid migration story for self-host upgrades.
- ~50MB Rust query engine in the image (acceptable for self-hosted).
- Generated client requires a postinstall step (handled in the Docker `builder` stage).

## Alternatives considered

- **TypeORM** — rejected. Documented decorator-metadata friction with `exactOptionalPropertyTypes`
  pushes teams toward lint suppressions, which contradicts constraint #14.
- **Drizzle** — strong contender, lighter, no codegen binary. Rejected for v0.1 because
  Prisma's ecosystem maturity + migration ergonomics win during the formative period.
  Revisit post-v1.0.
