# Cascade — root Claude context

Self-hosted visual AI workflow editor built on TierFall. **Tier routing is on the canvas,
not in a settings panel.**

## Layout

```
packages/
  cascade-tokens/    # @tierfall/cascade-tokens — design tokens (platform-neutral)
  cascade-core/      # @tierfall/cascade-core — workflow schema, graph utils (platform-neutral)
  cascade-sdk/       # @tierfall/cascade-sdk — fetch client (platform-neutral)
  cascade-ui/        # @tierfall/cascade-ui — Radix + Tailwind design system (web)
  cascade-nodes/     # @tierfall/cascade-nodes — node registry (server)
  cascade-compiler/  # @tierfall/cascade-compiler — graph → .ts emitter (server)
  cascade-cli/       # @tierfall/cascade-cli — `cascade run` binary (server)
apps/
  cascade-api/       # NestJS + Prisma + BullMQ + Socket.IO
  cascade-web/       # Next.js 15
  cascade-docs/      # Fumadocs (bundled in compose at port 3001)
  cascade-mobile/    # Expo skeleton (RN-boundary smoke test, excluded from default build)
  cascade-api-e2e/   # Testcontainers integration
  cascade-web-e2e/   # Playwright E2E
docs/
  superpowers/specs/ # design specs
  superpowers/plans/ # implementation plans
  adrs/              # architecture decision records
  testing.md         # 3-layer testing strategy
  n8n-parity.md      # parity matrix
```

## Hard rules (canonical: CONTRIBUTING.md and spec §13)

- TierFall is consumed via `@tierfall/core@^0.1.0` from npm — never forked, never vendored.
- No `any` outside test files.
- No `// eslint-disable*` / `// @ts-*` directives anywhere.
- No `git commit --no-verify`.
- No AI/assistant co-author trailers — commits are attributed solely to the human author.
- Conventional Commits + DCO sign-off (`git commit -s`).
- Branch off `develop`, PR into `develop`. `develop → main` PRs are releases only.
- Compile-to-TypeScript exit door is load-bearing — workflow schema stays compiler-friendly.

## Branch model

`main` (stable, npm + GHCR publish source) ← `develop` (default integration) ← feature branches.

## Where to find things

- Architecture facts: `AGENTS.md` (gitnexus-generated, refreshed weekly).
- Per-package specifics: each `packages/*/CLAUDE.md` and `apps/*/CLAUDE.md`.
- Active issues: `gh issue list` or the project board.
- Spec: `docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md` (frozen-in-time canonical).
- Plan: `docs/superpowers/plans/2026-05-22-cascade-phase3-scaffolding-plan.md` (this scaffolding work).
