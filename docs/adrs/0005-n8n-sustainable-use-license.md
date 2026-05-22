# ADR 0005: n8n Sustainable Use License

**Status:** Accepted (2026-05-22)
**Spec reference:** §10.1

## Context

Constraint #22 mandates a fair-code license (NOT MIT/Apache 2.0) that permits free
self-hosting (individual, commercial, internal) and restricts running Cascade as a
multi-tenant hosted service for third parties.

## Decision

n8n Sustainable Use License v1.0.

## Consequences

- Free for self-hosters, restricted only on the hosted-service-for-third-parties vector.
- Battle-tested since 2022 in the n8n ecosystem.
- Philosophically congruent — Cascade is positioned as an n8n alternative; using n8n's
  license signals alignment.

## Alternatives considered

- **Elastic License v2** — mature, but no narrative payoff vs SUL given the n8n positioning.
- **BSL with Change Date** — adds a time-bomb (`converts to Apache 2.0 in N years`).
  Some users find it reassuring; others confusing. SUL is simpler.
- **Apache 2.0 / MIT** — explicitly excluded by constraint #22.
