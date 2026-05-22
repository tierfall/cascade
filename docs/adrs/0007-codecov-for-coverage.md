# ADR 0007: Codecov for coverage reporting

**Status:** Accepted (2026-05-22)
**Spec reference:** §4.3

## Context

Constraint #18 requires 100% patch coverage on every PR. The tool needs robust diff-level
analysis and a clear PR comment surface. TierFall already uses Codecov (`codecov.yml`),
so consistency between sibling repos matters.

## Decision

Codecov. Patch coverage **blocking** at 100%. Project coverage informational with a 1pp
tolerance from baseline. Diverges from TierFall's `informational: true` patch config because
Cascade is application code with a hard PR gate (TierFall is library code with looser policy).

## Consequences

- Hosted dependency; outage means CI uploads fail (informative, but blocking).
- Per-component breakdown shows package/app coverage at a glance.

## Alternatives considered

- **jest-coverage-report-action** — no external service, but less polished diff UI and
  more bespoke wiring for patch analysis.
- **Coveralls** — fine, less popular in JS ecosystem; no reason to diverge from TierFall.
