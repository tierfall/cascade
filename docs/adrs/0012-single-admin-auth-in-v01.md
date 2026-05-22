# ADR 0012: Single-admin auth in v0.1

**Status:** Accepted (2026-05-22)
**Spec reference:** §5.5

## Context

Multi-tenant + RBAC is real engineering work. v0.1 is a read-only, self-hostable release;
it doesn't need teams. The roadmap puts multi-tenant in v0.5.

## Decision

First-to-`/setup` becomes the admin. JWT sessions in HttpOnly cookies. No second user
account in v0.1; the admin model has one role.

## Consequences

- Setup wizard is straightforward.
- v0.5 multi-tenant work has to add user/team/role tables additively (no destructive
  schema changes against the v0.1 single-admin schema). The User table already has a
  `role` column to leave room for expansion.

## Alternatives considered

- **Anonymous (no auth at all)** — too dangerous; secrets and credentials live here.
- **Full multi-user from v0.1** — out of scope; delays v0.1 by months.
