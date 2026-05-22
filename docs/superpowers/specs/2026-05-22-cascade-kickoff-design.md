---
date: 2026-05-22
status: approved
authors: [ronyv89]
supersedes: []
related-docs:
  - ../../adrs/ (to be populated in Phase 2 planning)
  - ../plans/2026-05-22-cascade-kickoff-plan.md (Phase 2)
  - ../../testing.md (Phase 2)
  - ../../n8n-parity.md (Phase 2)
---

# Cascade — kickoff design

Frozen-in-time record of the design decisions made during the Phase 1 brainstorm
for the `cascade` repository. This document is the canonical reference for
what was decided and why; ADRs in `docs/adrs/` (Phase 2) will refer back here
for each individual decision.

## 1. Strategic frame

**Cascade** is a self-hosted, fair-code, AI-native workflow editor positioned as
a direct alternative to n8n. It is built on top of TierFall, which is consumed
as a dependency. The differentiating ideas:

- **Tier routing is on the canvas, not in a settings panel.** Users see at a
  glance which parts of a workflow stay local and which can escalate to cloud.
- **Compile-to-TypeScript is a load-bearing exit door.** Workflows export as
  real `.ts` files that import `@tierfall/core` directly. The editor is
  scaffolding; the user owns the artifact.
- **Self-hosted Docker is the default deployment.** A single
  `docker compose up` at the repo root brings up the entire production stack.

Cascade never bypasses TierFall to call a provider directly. Routing features
that Cascade needs go upstream into TierFall; we do not fork or vendor it.

## 2. Repository conventions (mirroring TierFall)

The sibling `tierfall` repository at `../tierfall` establishes the team's
working conventions. Cascade mirrors them to minimize cognitive overhead when
switching repos.

| Convention | Value |
| --- | --- |
| Package manager | `pnpm@10.x` |
| Node engine | `>=24.0.0 <25.0.0` |
| Workspace tool | `nx` (latest stable) |
| Commit format | Conventional Commits + DCO sign-off (`git commit -s`) |
| Spec location | `docs/superpowers/specs/` |
| Plan location | `docs/superpowers/plans/` |
| ADR location | `docs/adrs/` |
| Branch model | `develop` (integration) ← feature branches; `main` ← release PRs from `develop` only |
| Lint stance | `--max-warnings 0`; no `any`, no `@ts-*`, no `eslint-disable` |
| Pre-commit | Husky + lint-staged + commitlint; `--no-verify` forbidden |

## 3. Architecture

### 3.1. Repository layout

```
cascade/
├── apps/
│   ├── cascade-web/           # Next.js frontend (ReactFlow canvas, consumes cascade-ui)
│   ├── cascade-api/           # NestJS backend (execution engine, BullMQ workers, WS gateway)
│   ├── cascade-docs/          # Fumadocs site (bundled in compose at port 3001)
│   ├── cascade-mobile/        # Expo skeleton — RN-boundary smoke test, excluded from default build
│   ├── cascade-web-e2e/       # Playwright E2E against docker compose up
│   └── cascade-api-e2e/       # Supertest + Testcontainers integration suite
├── packages/
│   ├── cascade-tokens/        # Pure-TS design tokens (colors, spacing, typography, motion, radii)
│   ├── cascade-core/          # Pure-TS shared types, Zod schemas, graph utilities
│   ├── cascade-sdk/           # Pure-TS typed API client (fetch-based; no DOM, no Node-only modules)
│   ├── cascade-ui/            # Radix + Tailwind components (shadcn-style, source in-repo)
│   ├── cascade-nodes/         # Node-type registry (LLM, Conditional, Transform, HTTP for v0.1)
│   ├── cascade-compiler/      # Graph-to-TypeScript compiler (scaffolded v0.1, feature-complete v0.3)
│   └── cascade-cli/           # `cascade run <workflow-id>` headless trigger (ships v0.1)
├── docs/
│   ├── adrs/                  # Architecture Decision Records
│   ├── n8n-parity.md          # n8n feature parity matrix (constraint #7)
│   ├── testing.md             # Testing strategy (constraint #17, #18)
│   └── superpowers/
│       ├── specs/             # design specs (this file lives here)
│       └── plans/             # implementation plans
└── docker-compose.yml         # single file; Ollama tagged `profiles: [demo]`, MinIO `profiles: [minio]`
```

### 3.2. Platform-neutrality boundary

Three packages remain pure TypeScript with **zero DOM, React DOM, Node-only,
or Next-only imports**:

- `cascade-tokens`
- `cascade-core`
- `cascade-sdk`

This is enforced by:

1. An ESLint `no-restricted-imports` rule scoped per-package.
2. A CI job that builds these three packages with `--isolatedModules` against
   a minimal RN-compatible target.
3. A working `apps/cascade-mobile` skeleton in Phase 3 that imports
   `cascade-sdk` and `cascade-tokens` and renders one screen — the boundary's
   smoke test.

The mobile skeleton is excluded from the default `nx run-many` set; it builds
independently when the RN-readiness CI job runs.

## 4. Toolchain decisions

### 4.1. TierFall dependency (decision #1 — auto-resolved by Phase 0)

`@tierfall/core@^0.1.0` and the published adapters (`@tierfall/adapter-ollama`,
`@tierfall/adapter-anthropic`, `@tierfall/adapter-openai-compatible`) are
consumed via normal npm/pnpm dependencies. All four are published at `0.1.0`
as of Phase 0 verification.

Versioning policy: pin to `^0.1.0` (minor auto-applies, major requires
explicit upgrade PR).

### 4.2. ORM (decision #3)

**Prisma.** Schema lives at `apps/cascade-api/prisma/schema.prisma`.
`prisma migrate deploy` runs on container boot. Generated client emits
strict-TS-friendly types compatible with `exactOptionalPropertyTypes` and
`noUncheckedIndexedAccess`.

Rationale: best DX, rock-solid migration story for self-host upgrades,
schema-first matches Cascade's declarative ethos. TypeORM rejected for
documented friction with strict TS lint rules; Drizzle considered as a third
option but Prisma's ecosystem maturity wins for v0.1.

### 4.3. Coverage tool (decision #7)

**Codecov.** Mirrors TierFall's `codecov.yml` setup. Patch-coverage gate
enforces 100% on every PR (constraint #18). Per-package floor thresholds
configured in each `jest.config.ts` via `coverageThreshold`.

### 4.4. Mutation and property testing (decision #8)

- **`fast-check` from v0.1** for `cascade-core` pure functions (graph
  traversal, workflow validation, schema parsing). Cheap to wire; large payoff
  on the edge-case requirement (constraint #18).
- **Stryker deferred to v0.2+**. Tracked as a Backlog issue. Added once the
  test suite stabilizes; not part of v0.1 CI to avoid 30+ min runs during
  scaffolding.

### 4.5. Coverage thresholds (constraint #18, formalized)

| Package | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| `cascade-tokens` | 100 | 100 | 100 | 100 |
| `cascade-core` | 100 | 100 | 100 | 100 |
| `cascade-sdk` | 100 | 100 | 100 | 100 |
| `cascade-nodes` | 95 | 95 | 95 | 95 |
| `cascade-compiler` | 95 | 95 | 95 | 95 |
| `cascade-cli` | 95 | 95 | 95 | 95 |
| `cascade-ui` | 95 | 95 | 95 | 95 |
| `cascade-web` | 90 | 90 | 90 | 90 |
| `cascade-api` | 90 | 90 | 90 | 90 |
| `cascade-docs` | n/a | n/a | n/a | n/a |

Aspirational target is 100% project-wide; the table is the gate.

Patch coverage (every PR): **100% on changed lines.** No exceptions without a
reviewer-approved `/* istanbul ignore next */`.

## 5. Deployment & operations

### 5.1. Docker compose scope (decision #2)

**Modular via Compose profiles** — a single `docker-compose.yml` at the repo
root, with optional services tagged via the `profiles:` key. No overlay files
(`-f compose.demo.yml`); profiles are the chosen mechanism.

- `docker compose up` — base stack only: `cascade-web`, `cascade-api`,
  `cascade-workers`, `cascade-docs`, `postgres`, `redis`. Services with no
  `profiles:` key always start.
- `docker compose --profile demo up` — base stack + Ollama. Ollama is opt-in
  because the image is multi-GB and many self-hosters already have Ollama
  running locally.
- `docker compose --profile minio up` — base stack + MinIO for S3-compatible
  storage testing in production-like environments.
- `docker compose --profile demo --profile minio up` — composes both.

All services use multi-stage Dockerfiles producing minimal production images.
CI publishes to `ghcr.io/tierfall/cascade-*` on every release tag.

### 5.2. Docs hosting (decision #9)

**Bundled in compose.** `cascade-docs` runs at port 3001 inside the stack.
Docs are reachable on first boot — true air-gapped self-hosted experience.
Vercel deploy is a post-v0.1 cleanup item; no Vercel-specific code lives in
the repo (Fumadocs static export is platform-agnostic).

### 5.3. Storage (decision #10)

**Pluggable `StorageProvider` interface in `cascade-api`** with two
implementations:

- `LocalFsStorage` (default) — files go to a mounted volume at `/data/storage`.
- `S3Storage` — activated via `STORAGE_DRIVER=s3` + standard AWS env vars.
  Works with any S3-compatible endpoint (AWS S3, MinIO, R2, Backblaze B2).

MinIO is available via `--profile minio` for users who want a complete
S3-compatible bundle in the compose stack.

### 5.4. First-boot security defaults (constraint #23)

- A first-boot setup wizard generates random secrets (JWT signing key,
  credentials-at-rest encryption key, internal API tokens).
- The first user to hit `/setup` becomes admin. No default password.
- Workflow node credentials (OAuth tokens, API keys) are encrypted at rest
  using the per-instance encryption key.
- CORS, CSRF, rate limiting, Helmet configured by default.

### 5.5. Auth model in v0.1

**Single-admin.** The first-to-`/setup` user becomes admin and is the only
account. Sessions via JWT in HttpOnly cookies. Multi-tenant + RBAC is the v0.5
roadmap item.

### 5.6. Telemetry in v0.1

**None.** OSS first-principles: no anonymous metrics, no Sentry, no
phone-home. Opt-in observability is a post-v0.1 discussion once we have a
clearer picture of self-hoster operational needs.

### 5.7. Execution safety limits (constraint #10, formalized as env defaults)

| Limit | Default | Env override |
| --- | --- | --- |
| Max nodes executed per run | 1000 | `CASCADE_MAX_NODES_PER_RUN` |
| Max wall-clock duration | 5 min | `CASCADE_MAX_RUN_DURATION_MS` |
| Max LLM cost per run | $1.00 | `CASCADE_MAX_RUN_COST_USD` |
| Max retry attempts per node | 3 | `CASCADE_MAX_NODE_RETRIES` |

Cost limits enforced via TierFall's budget hook.

## 6. Frontend stack

### 6.1. State library (decision #4)

**Zustand.** ReactFlow-idiomatic, smallest footprint, selector-based partial
subscriptions handle WebSocket-driven node-color updates efficiently. Sets
us up well for the v0.2 visual editor.

### 6.2. Tailwind config (decision #6)

**Preset pattern.** `cascade-ui` exports `tailwind-preset.ts`. This preset
imports `cascade-tokens` (the SSOT) and emits a complete Tailwind theme.
`cascade-web` extends the preset in its own `tailwind.config.ts`. Future
consumers add their own config that extends the same preset.

### 6.3. Design system (constraint #4, shadcn-style)

`cascade-ui` owns its source. Components are copied into the repo and
modified, not imported from a third-party design system. Built on Radix UI
primitives + Tailwind classes derived from `cascade-tokens`. Every component
is keyboard-accessible (Radix contract) and dark-mode-first.

The visual language is Cascade-specific (water-flowing-down-tiers metaphor),
not a clone of an existing palette. Specific token values are intentionally
not pinned in this spec — that's a v0.x design exercise in `cascade-tokens`
itself.

## 7. Tokens-as-SSOT and mobile readiness (decision #6 revised)

`cascade-tokens` is the **single source of truth** for visual language across
platforms. Platform-specific styling layers consume it directly.

```
cascade-tokens (pure TS, no DOM)
│
├─► cascade-ui (web)
│     └─► tailwind-preset.ts → Tailwind classes → Radix primitives
│
├─► cascade-mobile (v0.1 skeleton)
│     └─► inline StyleSheet.create({ color: tokens.colors.tier[0], ... })
│
└─► future cascade-ui-native (post-v1.0)
      └─► RN StyleSheet components mirroring cascade-ui's API
```

### 7.1. Why not NativeWind

NativeWind is "Tailwind-flavored" but not Tailwind-identical. Some web
utilities don't translate cleanly (`gap` semantics, arbitrary utilities,
web-only pseudo-states). For a project where mobile must visually match the
web, betting on NativeWind's compatibility surface introduces ongoing audit
burden. Token-direct styling on each platform eliminates that bet: whatever
`cascade-tokens` says is what each platform renders.

### 7.2. Mobile scope in v0.1 Phase 3

**Skeleton only.** `apps/cascade-mobile` contains one screen that:

1. Imports `@tierfall/cascade-sdk` (proves SDK is RN-portable).
2. Imports `@tierfall/cascade-tokens` (proves tokens are RN-portable).
3. Renders one Cascade-branded element (e.g., a tier badge) using inline
   `StyleSheet.create` derived from tokens.

The skeleton is excluded from the default Nx build. A dedicated CI job
verifies it builds against a minimal RN-compatible target. No
`cascade-ui-native` package is created in v0.1 — that's a post-v1.0 effort
when mobile starts shipping features.

## 8. Testing strategy (constraints #17, #18)

Three layers, all wired into CI:

### 8.1. Unit tests (Jest 29.x + ts-jest 29.x)

Every public function in every package. Mandatory edge cases per PR
(constraint #18): null inputs, undefined inputs, empty collections, boundary
values, error paths, race conditions where applicable, at least one negative
test per new/modified public function.

`fast-check` augments unit tests in `cascade-core` for generative coverage of
pure functions.

**Jest 29 is pinned.** Jest 30 / ts-jest 30 is not stable for our toolchain
(constraint #17).

### 8.2. Integration tests (Jest + Testcontainers in `apps/cascade-api-e2e`)

Real Postgres, real Redis, real BullMQ. No in-memory fakes. Covers:

- Workflow CRUD against real DB.
- Full workflow execution against real queue.
- WebSocket gateway with real Redis pub/sub.
- Encrypted credential storage round-trip.
- Multi-tenant isolation (forward-looking; verifies the data model is ready).

Testcontainers spins up the services in CI.

### 8.3. E2E tests (Playwright in `apps/cascade-web-e2e`)

Browser-driven, running against the full `docker compose up` stack. CI builds
the images, brings up the compose stack, runs the suite, tears down. Covers:

- Home page renders with the design system applied (dark mode default).
- Workflow graph displays from the API.
- Live execution feedback updates node colors via WebSocket.
- CLI-triggered run appears in UI history.
- Webhook trigger creates a run visible in UI.
- Error states display correctly.
- Keyboard navigation works on every interactive element.

### 8.4. Flake policy

A test that fails intermittently is broken. Quarantine via `.skip` requires
a tracked GitHub issue and a fix deadline in the comment. CI fails on any
flake detected by automatic retry.

## 9. Workflow schema as public API (constraint #21)

The JSON schema for a workflow (nodes, edges, policies, triggers) lives in
`@tierfall/cascade-core` and is the public contract between the editor, the
executor, the compiler, and any third-party tools.

- Published as a JSON Schema document at build time.
- Follows semver.
- Breaking changes require a migration plan and a `schema-version` field bump.
- Compiler-friendly from v0.1 — no editor-only constructs that the v0.3
  compiler can't emit.

## 10. License and release strategy

### 10.1. License (decision #5)

**n8n Sustainable Use License (SUL).** Fair-code: permits free use
(individual, commercial, internal), modifications, and redistribution.
Restricts running Cascade as a multi-tenant hosted service for third parties.

Rationale: Cascade is positioned as an n8n alternative, so SUL is the
philosophically congruent choice. SUL is well-understood in the OSS community
since n8n popularized it. Apache 2.0 and MIT are explicitly excluded by
constraint #22.

### 10.2. Versioning (decision #11)

**Synchronized.** All `@tierfall/cascade-*` packages bump together via Nx /
Changesets in `fixed` mode. `git tag v0.1.0` → every package at `0.1.0`,
every Docker image tagged `:0.1.0`. Self-hosters reason about one version
number.

Revisit post-v1.0 when the ecosystem stabilizes — switching to independent
versioning is a Changesets config flag, not a rewrite.

### 10.3. Demo workflow (constraint #8, formalized)

The v0.1 demo workflow exercises **two TierFall adapters** to make
vendor-neutrality concrete. The recommended pairing is:

- Primary: `@tierfall/adapter-ollama` (local, free).
- Fallback: `@tierfall/adapter-openai-compatible` or
  `@tierfall/adapter-anthropic` (cloud).

The demo is reachable via `docker compose --profile demo up`. The fallback
requires a user-provided API key set in `.env` — surfaced clearly in the
first-boot setup wizard.

## 11. v0.1 acceptance criteria (gates the release)

- [ ] `docker compose up` brings up the full stack and the home page renders.
- [ ] Demo workflow (two adapters via TierFall) runs end-to-end with visible
      tier attribution in the read-only graph view.
- [ ] CLI (`cascade run <workflow-id>`) triggers a workflow against the API.
- [ ] Webhook trigger creates a visible run in UI history.
- [ ] All three test layers green: unit + integration (Testcontainers) +
      E2E (Playwright against the compose stack).
- [ ] Coverage gates pass per the table in §4.5; 100% patch coverage on all
      v0.1 PRs.
- [ ] `docs/n8n-parity.md` exists, accurate, and linked from README.
- [ ] `docs/testing.md` exists and matches §8.
- [ ] Per-package `CLAUDE.md` files exist.
- [ ] `apps/cascade-mobile` skeleton builds against the RN target in CI.
- [ ] ESLint rule enforcing platform-neutral imports in `cascade-tokens`,
      `cascade-core`, `cascade-sdk` is wired up and green.
- [ ] `.env.example`, `README.md`, `CONTRIBUTING.md`, `LICENSE` (SUL),
      `CODE_OF_CONDUCT.md`, `SECURITY.md`, `.github/pull_request_template.md`
      all present.
- [ ] Published packages: `@tierfall/cascade-*` to npm.
- [ ] Published images: `ghcr.io/tierfall/cascade-*:0.1.0`.
- [ ] GitHub Projects board with Backlog populated (~25–35 issues).

## 12. Open items deferred to Phase 2 planning

The following are not in scope for this spec; they are surfaced for the Phase
2 plan to address:

- Concrete commit sequence for Phase 3 (target 14–20 commits).
- Concrete v0.1 issue list for the GitHub Projects Backlog (~25–35 issues).
- Per-package `CLAUDE.md` content outlines.
- ADR file structure and the initial set of ADR stubs (one per major
  decision in this spec).
- Specific design token values for the Cascade visual language
  (water-flowing-down-tiers metaphor) — left to a focused v0.x design pass
  in `cascade-tokens` itself.
- Specific node-type schemas for the four v0.1 nodes (LLM, Conditional,
  Transform, HTTP).
- Concrete CI orchestration (which workflows trigger on push vs PR vs
  release).

## 13. Decisions log (provenance)

All decisions recorded in this spec map back to the Phase 1 brainstorm
conducted on 2026-05-22. The "Recommended" option was selected in every case;
the user revised the original mobile-styling answer mid-brainstorm to reject
NativeWind in favor of token-direct StyleSheet styling (see §7.1).
