# B-API-AUTH-SETUP — first-boot setup wizard design

Closes #10. Implements spec §5.4 and §5.5.

## Goal

Provide a self-contained, idempotent first-boot wizard that:

1. Creates the single admin `User` (email + password).
2. Generates the two per-instance secrets (`JWT_SECRET`, `CREDENTIALS_ENC_KEY`)
   if they are not already supplied via environment variables.
3. Cleanly retires itself: after one admin exists, the endpoint reports
   `410 Gone` and refuses further writes.

No JWT issuance happens here (that lands in B-API-AUTH-JWT, #11). No
credential encryption is exercised here (B-API-CREDENTIALS, #12). No web UI
(B-WEB-SETUP-WIZARD, #22).

## Data model

Additive change to `apps/cascade-api/prisma/schema.prisma`:

```prisma
model InstanceSecret {
  key       String   @id   // "JWT_SECRET" | "CREDENTIALS_ENC_KEY"
  value     String         // hex-encoded random bytes
  createdAt DateTime @default(now())
}
```

`User` is already defined and used unchanged.

Hex encoding (vs base64 / bytes) keeps the env-var override and DB row
interchangeable strings; both are read as `string` by `SecretService`.

## Modules

### `src/secrets/`

- `secret.service.ts` — `@Injectable()`, exposes
  `get(key: SecretKey): Promise<string>`. On first call per key:
  1. Read `process.env[key]`. If non-empty, return it.
  2. Otherwise read the `InstanceSecret` row. If present, return `value`.
  3. Otherwise throw `SecretNotInitializedError`.
     Subsequent calls hit a per-instance cache (no DB round-trip per request).
- `secret.module.ts` — provider + exports.
- `secret-key.ts` — exported type alias:
  `type SecretKey = 'JWT_SECRET' | 'CREDENTIALS_ENC_KEY';`

Env wins over DB so a power user can rotate by setting `JWT_SECRET=...` and
restarting; the DB row stays as a fallback for the air-gapped self-host story.

### `src/setup/`

- `setup.controller.ts` — `@Controller('setup')`:
  - `@Get()` — calls `setupService.status()`. Returns 200 with form schema
    when `needsSetup === true`, else 410.
  - `@Post()` — `@Body()` Zod-validated against `SetupBodySchema`. Calls
    `setupService.initialize(body)`. Returns 201 on success, 410 on
    already-initialized, 400 on validation failure.
- `setup.service.ts`:
  - `status()` → `{ needsSetup: boolean }` based on `user.count() === 0`.
  - `initialize(body)` → wraps everything below in a single
    `prisma.$transaction`, returning `{ id, email }`.

`initialize` transaction steps:

1. `SELECT pg_try_advisory_xact_lock(0xCA5CADE5E70705E7::bigint)` (a fixed
   magic). If `false`, throw `ConcurrentSetupError` → 409.
2. Re-check `user.count()`. If `> 0`, throw `AlreadyInitializedError` → 410.
3. Hash password with argon2id (defaults).
4. `user.create({ email, passwordHash, role: 'admin' })`.
5. For each of `JWT_SECRET`, `CREDENTIALS_ENC_KEY`: if a row already exists,
   leave it; otherwise
   `instanceSecret.create({ key, value: hex(randomBytes(32)) })`. The env-var
   (if any) is _not_ copied into the row — it stays the read-time override,
   and the DB row is always seeded with a fresh random value so the instance
   is not silently dependent on a transient env var.

Generated secret values are never returned in the response — they are not
necessarily the authoritative values consumers will read.

### `src/setup/dto.ts`

```ts
export const SetupBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(12),
  })
  .strict();
export type SetupBody = z.infer<typeof SetupBodySchema>;
```

Strict mode rejects unknown keys — closes the door on mass-assignment.

### Wiring

`SetupModule` and `SecretModule` registered in `app.module.ts`. `SecretModule`
is `@Global()` so future consumers (auth, credentials) can inject it without
explicit imports.

## Contract

| Request                          | Pre-state  | Status | Body                                                                                                                       |
| -------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------- |
| `GET /setup`                     | no User    | `200`  | `{ "needsSetup": true, "fields": [{"name":"email","type":"email"},{"name":"password","type":"password","minLength":12}] }` |
| `GET /setup`                     | ≥1 User    | `410`  | `{ "needsSetup": false }`                                                                                                  |
| `POST /setup` valid body         | no User    | `201`  | `{ "id": "...", "email": "..." }`                                                                                          |
| `POST /setup` valid body         | ≥1 User    | `410`  | `{ "error": "ALREADY_INITIALIZED" }`                                                                                       |
| `POST /setup` invalid body       | any        | `400`  | `{ "error": "VALIDATION", "issues": [...] }`                                                                               |
| `POST /setup` lost the lock race | concurrent | `409`  | `{ "error": "CONCURRENT_SETUP" }`                                                                                          |

Errors are translated by a small Nest exception filter (`SetupExceptionFilter`)
that maps the three domain errors above to the right HTTP code; everything
else propagates to Nest's default filter (→ 500).

## Concurrency

Two layers:

1. **Postgres advisory transaction lock** (`pg_try_advisory_xact_lock`) — only
   one transaction proceeds past the lock. Released on transaction end.
2. **`User.email` unique index** — independent backstop: even without the
   lock, a duplicate user create would collide.

The advisory-lock layer guards against the rare 410-vs-201 dual-success case
when both transactions see `user.count() === 0`.

## Dependencies (new)

Added to `apps/cascade-api/package.json`:

- `argon2@^0.41` — Argon2id hashing.

No new dev deps; Zod is already there.

## Tests

### Unit (`apps/cascade-api/src/**/*.spec.ts`, jest, mocked PrismaService)

- `SecretService`:
  - env wins over DB
  - DB used when env empty
  - throws when neither present
  - caches per-key (one DB read for two `get` calls)
- `SetupService`:
  - `status()` reflects user count
  - `initialize` happy path returns `{ id, email }` (verified via Prisma mock)
  - `initialize` always inserts both `InstanceSecret` rows, even when env
    is set (env is a read-time override, not a write-time skip)
  - Zod DTO rejects short password, malformed email, extra keys

### Integration (`apps/cascade-api-e2e/src/setup.e2e-spec.ts`, real Postgres)

- `GET /setup` → 200 + needsSetup true on empty DB
- `POST /setup` → 201, persists User with argon2id hash, persists both
  `InstanceSecret` rows
- `GET /setup` → 410 after seed
- `POST /setup` → 410 after seed
- `POST /setup` with `password: 'short'` → 400, no User created
- `POST /setup` with `extraField: 'x'` → 400 (strict mode)
- 10 concurrent `POST /setup` → exactly one 201, rest 410 or 409,
  exactly one User row, exactly two `InstanceSecret` rows
- `POST /setup` with `JWT_SECRET` env preset → both `InstanceSecret` rows
  are still inserted (DB always seeded); `SecretService.get('JWT_SECRET')`
  returns the env value, not the row value

## Out of scope

- JWT issuance / login (B-API-AUTH-JWT, #11)
- Cookie session middleware
- Credentials AES encryption (B-API-CREDENTIALS, #12)
- Setup wizard web UI (B-WEB-SETUP-WIZARD, #22)
- Password reset / multi-user (v0.5)

## Risks & mitigations

- **Argon2 native build** — `argon2` ships prebuilds for Node 24 on linux-x64,
  linux-arm64, darwin-x64, darwin-arm64. The Cascade Dockerfile target is
  `node:24-alpine`, which uses musl: argon2 prebuilds cover this. If build
  ever fails CI, fallback is `argon2-browser`/pure-WASM — but we only switch
  if it actually breaks.
- **Lost env var after first boot** — operator removes `JWT_SECRET` from env
  after wizard ran. Without mitigation, `SecretService` would fall through
  to a missing DB row and throw. Mitigation (built into `SetupService`):
  always seed the DB row with a fresh random value during setup, regardless
  of env. The DB row is the durable source of truth; env is the read-time
  override. This is also why generated secret values are never returned in
  the POST /setup response — they may not be authoritative.
- **Secrets in DB backups** — documented in `apps/cascade-api/CLAUDE.md` as
  part of the threat model: DB backups inherit the trust level of the running
  instance.

## Acceptance

- All tests above green.
- `pnpm --filter cascade-api lint typecheck test` clean.
- `pnpm --filter cascade-api-e2e test` green (real Postgres via Testcontainers).
- Coverage on new files ≥ 90% (the app-tier floor); patch coverage 100% per
  CONTRIBUTING.md.
- Conventional Commits + DCO sign-off, no AI co-author trailer.
