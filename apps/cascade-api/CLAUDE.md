# cascade-api — Claude context

**Purpose:** NestJS HTTP + WebSocket gateway + BullMQ worker for Cascade.
Owns the workflow definition store, the runs persistence, and the per-node
tier-attribution log.

## What lives here

- `src/main.ts` — Nest bootstrap. Helmet, CORS, listen.
- `src/app.module.ts` — root module. ConfigModule + ThrottlerModule + PrismaModule + HealthModule.
- `src/prisma/` — global PrismaService wrapping PrismaClient.
- `src/health/` — `/health` endpoint that round-trips a `SELECT 1`.
- `prisma/schema.prisma` — v0.1 entities: User, Workflow, Run, NodeExecution,
  EncryptedCredential. Migrations live in `prisma/migrations/` (Testcontainers
  in Task 16 runs `prisma migrate deploy`).
- Future (each landed as a v0.1 backlog issue):
  - `src/workflows/` — CRUD against Workflow table.
  - `src/runs/` — execution engine, BullMQ queues, run history.
  - `src/auth/` — first-boot setup wizard + JWT sessions.
  - `src/credentials/` — AES-256-GCM at rest using `CREDENTIALS_ENC_KEY`.
  - `src/storage/` — pluggable StorageProvider (local + S3).
  - `src/ws/` — Socket.IO gateway broadcasting node-execution state changes.

## Hard rules

- 90% coverage threshold. `main.ts` and `*.module.ts` excluded from collection
  (verified by integration tests instead).
- No `any`, no `@ts-ignore`. PrismaService extends PrismaClient — the generated
  client is typed.
- Real DB / Redis / BullMQ in integration tests (cascade-api-e2e, Task 16). No
  in-memory fakes.
- TierFall is consumed via `@tierfall/core@^0.1.0` directly — never wrapped, never
  forked. If a routing feature is needed, it goes upstream.
