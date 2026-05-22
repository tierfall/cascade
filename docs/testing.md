# Testing strategy

Three layers. All wired into CI. No layer is optional.

## Layer 1 — Unit tests (Jest 29.x + ts-jest 29.x)

Every public function in every package. Coverage thresholds enforced per-package via
`coverageThreshold` in each `jest.config.ts`:

| Package            | Threshold | Notes                                                  |
| ------------------ | --------- | ------------------------------------------------------ |
| `cascade-tokens`   | 100%      | pure TS, no excuses                                    |
| `cascade-core`     | 100%      | augmented by fast-check property tests                 |
| `cascade-sdk`      | 100%      | fetch injectable for testing without DOM polyfills     |
| `cascade-ui`       | 95%       | React Testing Library + jsdom                          |
| `cascade-nodes`    | 95%       | node-type stubs + http handler                         |
| `cascade-compiler` | 95%       | compile + emit                                         |
| `cascade-cli`      | 95%       | parseArgs + runCommand                                 |
| `cascade-web`      | 90%       | layout/page/route excluded — covered by Playwright     |
| `cascade-api`      | 90%       | main.ts/module.ts excluded — covered by Testcontainers |
| `cascade-docs`     | n/a       | content, not logic                                     |

Aspirational target is 100% project-wide; the table is the gate.

Edge-case coverage is mandatory in PRs (constraint #18). Tests must explicitly cover:

- null inputs
- undefined inputs
- empty collections
- boundary values (zero, one, max)
- error paths
- at least one negative test per public function added/modified
- race conditions where applicable

## Layer 2 — Integration tests (Testcontainers, in `apps/cascade-api-e2e`)

**Real** Postgres + Redis + BullMQ. No in-memory fakes.

Covers:

- Workflow CRUD against real DB
- Full workflow execution against real queue
- WebSocket gateway with real Redis pub/sub
- Encrypted credential storage round-trip
- Multi-tenant isolation (data-model verification, forward-looking for v0.5)

First run pulls `postgres:16-alpine` and `redis:7-alpine` (~60s); subsequent runs <15s.
Suite runs serially (`--runInBand`) so container ports don't collide.

## Layer 3 — E2E tests (Playwright, in `apps/cascade-web-e2e`)

Browser-driven, run against the full `docker compose up` stack. NOT against a dev server.
NOT against mocked services.

CI orchestrates: build images → `docker compose up -d --wait` → run Playwright → tear down.

Covers (v0.1):

- Home page renders with design system applied (dark mode default).
- Tier ramp displays.
- CTA button renders.

Backlogged additions (each landed as a separate v0.1 issue):

- Workflow graph displays from API.
- Live execution feedback updates node colors via WebSocket.
- CLI-triggered run appears in UI history.
- Webhook trigger creates a visible run.
- Error states display correctly.
- Keyboard navigation works on every interactive element.

## Property-based tests (fast-check)

Used in `cascade-core` to augment example-based tests for pure functions:

- Graph utilities (`hasCycle`, `topologicalSort`, `reachableFrom`).
- Workflow schema rejection paths (random invalid `id`, etc.).

Stryker mutation testing is **deferred to v0.2+** (spec §4.4). The 30+ min mutation runs
would dominate scaffolding-phase CI; revisit once the suite stabilizes.

## Flake policy

A test that fails intermittently is broken. Quarantine via `.skip` requires:

- A tracked GitHub issue
- A fix deadline in the test comment

CI fails on any flake detected by automatic retry. Retries (1 in Playwright config) are
for genuine network blips, NOT for masking broken tests.

## CI orchestration

| Workflow          | Trigger                        | Layers                           |
| ----------------- | ------------------------------ | -------------------------------- |
| `ci.yml`          | every push + PR                | Unit (affected) + Codecov upload |
| `integration.yml` | every push + PR                | Integration (Testcontainers)     |
| `e2e.yml`         | PR + main                      | E2E (Playwright against compose) |
| `rn-boundary.yml` | tokens/core/sdk/mobile changes | RN-target tsc + ESLint boundary  |
| `release.yml`     | tag on main                    | Build, npm publish, GHCR push    |
