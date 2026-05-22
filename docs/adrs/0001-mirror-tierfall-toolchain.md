# ADR 0001: Mirror TierFall toolchain conventions

**Status:** Accepted (2026-05-22)
**Spec reference:** `docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md` §2

## Context

Cascade lives next to the TierFall repo and depends on it. The team's working
conventions are already established by TierFall — pnpm, Nx, Node 24, DCO sign-off,
ESLint flat config with no escape hatches. The kickoff asked whether Cascade
should adopt these exactly, partially, or fresh.

## Decision

Mirror TierFall exactly:

- pnpm 10.33.0 (locked via `packageManager` in package.json)
- Node `>=24.0.0 <25.0.0`
- DCO sign-off via `git commit -s` (prepare-commit-msg hook auto-appends)
- Specs at `docs/superpowers/specs/`, plans at `docs/superpowers/plans/`
- Same eslint.config.mjs shape, same lint-staged config, same commitlint enum

## Consequences

- Zero cognitive friction switching between repos.
- Anyone with Node 20 must bump (Node 24 is mandatory).
- Bumping pnpm/Node/Nx is coordinated across both repos.

## Alternatives considered

- **Mirror but skip DCO** — rejected; DCO is already proven and easy.
- **Use kickoff's Node 20 floor with npm** — rejected; diverges from TierFall.
