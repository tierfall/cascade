# Contributing to Cascade

## Prerequisites

- Node `>=24.0.0 <25.0.0` (see `.nvmrc`)
- pnpm `>=10.0.0` (we pin `pnpm@10.33.0`)
- Docker with `docker compose` v2

## Dev loop

```bash
pnpm install
pnpm exec husky      # sets up pre-commit hooks (runs automatically on `pnpm install` too)
pnpm test            # all unit tests
pnpm test:int        # integration tests (Testcontainers — spins up Postgres + Redis)
pnpm test:e2e        # Playwright against `docker compose up`
pnpm check           # lint + typecheck + test + build, all in parallel
```

## Branch model

- `main` — stable, tagged releases only. Branch-protected: required status checks,
  required review, no force pushes.
- `develop` — integration branch. All feature work merges here via PR.
- Feature branches: `feat/*`, `fix/*`, `chore/*`, `docs/*`, `test/*`, `refactor/*`.

Releases: PR `develop → main`, titled `release: vX.Y.Z`. Tag applied to `main` after merge.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/), enforced by `commitlint`.
- DCO sign-off required (`git commit -s` — the `prepare-commit-msg` hook adds the trailer if you forget).
- `--no-verify` is forbidden. If pre-commit fails, fix the issue.
- **No AI/assistant co-author trailers** — commits are attributed solely to the human author.

## Coverage gates

Per [spec §4.5](docs/superpowers/specs/2026-05-22-cascade-kickoff-design.md):

| Package tier                                                               | Floor |
| -------------------------------------------------------------------------- | ----- |
| Platform-neutral (`cascade-tokens`, `cascade-core`, `cascade-sdk`)         | 100%  |
| Library (`cascade-ui`, `cascade-nodes`, `cascade-compiler`, `cascade-cli`) | 95%   |
| App (`cascade-web`, `cascade-api`)                                         | 90%   |
| Docs                                                                       | n/a   |

PR-level: **100% patch coverage** — every new line covered by a test in the same PR.

## PR checklist (template enforces)

- [ ] Tests added for changes (specify edge cases).
- [ ] Coverage delta acceptable (Codecov comment on PR).
- [ ] Docs updated if user-facing.
- [ ] n8n-parity matrix updated if applicable.
- [ ] No `any`, no `@ts-ignore`, no `eslint-disable`.
- [ ] DCO signed off.

## Testing strategy

See [docs/testing.md](docs/testing.md).
