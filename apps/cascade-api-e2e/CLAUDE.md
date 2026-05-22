# cascade-api-e2e — Claude context

**Purpose:** Integration tests for cascade-api against **real** Postgres + Redis
via Testcontainers. NO in-memory fakes, NO mocked databases (spec §8.2).

## Adding a test

1. Pick a feature in cascade-api (e.g., workflows CRUD).
2. Write a `*.e2e-spec.ts` in `src/` that boots the NestJS app via Test.createTestingModule.
3. Use the shared `startBackingServices()` helper for Postgres + Redis.
4. Use supertest to drive HTTP.

Tests run serially (`--runInBand`) so container ports don't collide.

## Hard rules

- No mocks of Prisma, BullMQ, Redis, Socket.IO. If you find yourself reaching for one,
  the test belongs in the unit suite of the relevant package.
- 120s timeout is the per-test cap. First-run container pulls fit inside this; if a
  test runs that long for any other reason, refactor.
