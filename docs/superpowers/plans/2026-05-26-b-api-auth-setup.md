# B-API-AUTH-SETUP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a first-boot setup wizard for `cascade-api` that creates the single admin user and generates per-instance secrets, gated to one-time use.

**Architecture:** Two new NestJS modules — `SecretModule` (env-first / DB-fallback secret reader) and `SetupModule` (controller + service for `/setup`). One new Prisma model (`InstanceSecret`). Argon2id for password hashing. All multi-step writes happen inside a single `prisma.$transaction` guarded by a Postgres advisory lock.

**Tech Stack:** NestJS 10, Prisma 6, Zod 3, argon2, Jest, Testcontainers, supertest.

**Spec:** `docs/superpowers/specs/2026-05-26-b-api-auth-setup-design.md`

---

## File Structure

**Create:**

- `apps/cascade-api/src/secrets/secret-key.ts` — `SecretKey` type alias.
- `apps/cascade-api/src/secrets/secret.service.ts` — env-first reader with DB fallback + cache.
- `apps/cascade-api/src/secrets/secret.service.spec.ts` — unit tests for SecretService.
- `apps/cascade-api/src/secrets/secret.module.ts` — `@Global()` provider module.
- `apps/cascade-api/src/setup/dto.ts` — Zod `SetupBodySchema`.
- `apps/cascade-api/src/setup/dto.spec.ts` — DTO validation tests.
- `apps/cascade-api/src/setup/setup.errors.ts` — domain errors (`AlreadyInitializedError`, `ConcurrentSetupError`).
- `apps/cascade-api/src/setup/setup.service.ts` — `status()` and `initialize()`.
- `apps/cascade-api/src/setup/setup.service.spec.ts` — unit tests for SetupService (Prisma mocked).
- `apps/cascade-api/src/setup/setup.exception-filter.ts` — maps domain errors to HTTP.
- `apps/cascade-api/src/setup/setup.controller.ts` — GET/POST handlers.
- `apps/cascade-api/src/setup/setup.controller.spec.ts` — controller unit tests (service mocked).
- `apps/cascade-api/src/setup/setup.module.ts` — wires it together.
- `apps/cascade-api-e2e/src/setup.e2e-spec.ts` — integration tests.

**Modify:**

- `apps/cascade-api/prisma/schema.prisma` — add `InstanceSecret` model.
- `apps/cascade-api/package.json` — add `argon2@^0.41` dependency.
- `apps/cascade-api/src/app.module.ts` — import `SecretModule` and `SetupModule`.

---

## Task 1: Add InstanceSecret to Prisma schema

**Files:**

- Modify: `apps/cascade-api/prisma/schema.prisma`

- [ ] **Step 1: Add the model after the `User` block**

```prisma
model InstanceSecret {
  key       String   @id // "JWT_SECRET" | "CREDENTIALS_ENC_KEY"
  value     String // hex-encoded random bytes
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Regenerate the Prisma client**

Run: `pnpm --filter cascade-api exec prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: Commit**

```bash
git add apps/cascade-api/prisma/schema.prisma
git commit -s -m "feat(api): add InstanceSecret model for setup-generated keys"
```

---

## Task 2: Add argon2 dependency

**Files:**

- Modify: `apps/cascade-api/package.json`

- [ ] **Step 1: Add the dependency**

Run: `pnpm --filter cascade-api add argon2@^0.41`
Expected: argon2 appears under `dependencies` in `apps/cascade-api/package.json`.

- [ ] **Step 2: Verify lockfile updated**

Run: `git status --short`
Expected: both `package.json` and `pnpm-lock.yaml` modified.

- [ ] **Step 3: Commit**

```bash
git add apps/cascade-api/package.json pnpm-lock.yaml
git commit -s -m "chore(api): add argon2 for password hashing"
```

---

## Task 3: SecretKey type

**Files:**

- Create: `apps/cascade-api/src/secrets/secret-key.ts`

- [ ] **Step 1: Write the file**

```ts
export const SECRET_KEYS = ['JWT_SECRET', 'CREDENTIALS_ENC_KEY'] as const;
export type SecretKey = (typeof SECRET_KEYS)[number];
```

- [ ] **Step 2: Commit (held until Task 4 lands — no standalone commit yet)**

(Task 3 is bundled into Task 4's commit so we don't ship an unused type.)

---

## Task 4: SecretService with failing tests

**Files:**

- Create: `apps/cascade-api/src/secrets/secret.service.spec.ts`
- Create: `apps/cascade-api/src/secrets/secret.service.ts`

- [ ] **Step 1: Write failing tests**

`apps/cascade-api/src/secrets/secret.service.spec.ts`:

```ts
import { jest } from '@jest/globals';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecretService, SecretNotInitializedError } from './secret.service.js';

type InstanceSecretRow = { key: string; value: string; createdAt: Date };
type FindUniqueArgs = { where: { key: string } };

describe('SecretService', () => {
  const findUnique = jest.fn<(args: FindUniqueArgs) => Promise<InstanceSecretRow | null>>();
  const prisma = { instanceSecret: { findUnique } } as unknown as PrismaService;
  let service: SecretService;

  beforeEach(async () => {
    findUnique.mockReset();
    delete process.env.JWT_SECRET;
    delete process.env.CREDENTIALS_ENC_KEY;
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [SecretService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(SecretService);
  });

  it('returns env value when set', async () => {
    process.env.JWT_SECRET = 'env-jwt';
    await expect(service.get('JWT_SECRET')).resolves.toBe('env-jwt');
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('falls back to DB row when env is empty', async () => {
    findUnique.mockResolvedValueOnce({
      key: 'JWT_SECRET',
      value: 'db-jwt',
      createdAt: new Date(),
    });
    await expect(service.get('JWT_SECRET')).resolves.toBe('db-jwt');
    expect(findUnique).toHaveBeenCalledWith({ where: { key: 'JWT_SECRET' } });
  });

  it('throws SecretNotInitializedError when neither env nor DB row exists', async () => {
    findUnique.mockResolvedValueOnce(null);
    await expect(service.get('JWT_SECRET')).rejects.toBeInstanceOf(SecretNotInitializedError);
  });

  it('caches per key — second get does not re-query', async () => {
    findUnique.mockResolvedValueOnce({
      key: 'CREDENTIALS_ENC_KEY',
      value: 'k',
      createdAt: new Date(),
    });
    await service.get('CREDENTIALS_ENC_KEY');
    await service.get('CREDENTIALS_ENC_KEY');
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it('treats empty-string env as unset (falls through to DB)', async () => {
    process.env.JWT_SECRET = '';
    findUnique.mockResolvedValueOnce({
      key: 'JWT_SECRET',
      value: 'db-jwt',
      createdAt: new Date(),
    });
    await expect(service.get('JWT_SECRET')).resolves.toBe('db-jwt');
  });
});
```

- [ ] **Step 2: Run test, verify failure**

Run: `pnpm --filter cascade-api test -- secret.service.spec.ts`
Expected: FAIL — `Cannot find module './secret.service.js'`.

- [ ] **Step 3: Implement SecretService**

`apps/cascade-api/src/secrets/secret.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SecretKey } from './secret-key.js';

export class SecretNotInitializedError extends Error {
  constructor(key: SecretKey) {
    super(`Secret '${key}' is not initialized. Run POST /setup first.`);
    this.name = 'SecretNotInitializedError';
  }
}

@Injectable()
export class SecretService {
  private readonly cache = new Map<SecretKey, string>();

  constructor(private readonly prisma: PrismaService) {}

  async get(key: SecretKey): Promise<string> {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;

    const env = process.env[key];
    if (env !== undefined && env.length > 0) {
      this.cache.set(key, env);
      return env;
    }

    const row = await this.prisma.instanceSecret.findUnique({ where: { key } });
    if (row === null) {
      throw new SecretNotInitializedError(key);
    }
    this.cache.set(key, row.value);
    return row.value;
  }
}
```

- [ ] **Step 4: Run test, verify pass**

Run: `pnpm --filter cascade-api test -- secret.service.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cascade-api/src/secrets/
git commit -s -m "feat(api): SecretService — env-first reader with DB fallback"
```

---

## Task 5: SecretModule (global)

**Files:**

- Create: `apps/cascade-api/src/secrets/secret.module.ts`

- [ ] **Step 1: Write the module**

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SecretService } from './secret.service.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SecretService],
  exports: [SecretService],
})
export class SecretModule {}
```

- [ ] **Step 2: Run cascade-api typecheck**

Run: `pnpm --filter cascade-api exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/cascade-api/src/secrets/secret.module.ts
git commit -s -m "feat(api): export SecretService via global SecretModule"
```

---

## Task 6: Setup DTO

**Files:**

- Create: `apps/cascade-api/src/setup/dto.ts`
- Create: `apps/cascade-api/src/setup/dto.spec.ts`

- [ ] **Step 1: Write failing tests**

`apps/cascade-api/src/setup/dto.spec.ts`:

```ts
import { SetupBodySchema } from './dto.js';

describe('SetupBodySchema', () => {
  it('accepts a valid email + 12-char password', () => {
    const result = SetupBodySchema.safeParse({
      email: 'admin@example.com',
      password: 'correct-horse',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-email', () => {
    const result = SetupBodySchema.safeParse({ email: 'nope', password: 'correct-horse' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 12 chars', () => {
    const result = SetupBodySchema.safeParse({
      email: 'admin@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects extra keys (strict mode)', () => {
    const result = SetupBodySchema.safeParse({
      email: 'admin@example.com',
      password: 'correct-horse',
      role: 'superuser',
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `pnpm --filter cascade-api test -- dto.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement DTO**

`apps/cascade-api/src/setup/dto.ts`:

```ts
import { z } from 'zod';

export const SetupBodySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(12),
  })
  .strict();

export type SetupBody = z.infer<typeof SetupBodySchema>;
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter cascade-api test -- dto.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cascade-api/src/setup/dto.ts apps/cascade-api/src/setup/dto.spec.ts
git commit -s -m "feat(api): SetupBodySchema — strict Zod DTO for /setup"
```

---

## Task 7: Setup domain errors

**Files:**

- Create: `apps/cascade-api/src/setup/setup.errors.ts`

- [ ] **Step 1: Write the errors**

```ts
export class AlreadyInitializedError extends Error {
  constructor() {
    super('Cascade is already initialized.');
    this.name = 'AlreadyInitializedError';
  }
}

export class ConcurrentSetupError extends Error {
  constructor() {
    super('Another setup request is in flight.');
    this.name = 'ConcurrentSetupError';
  }
}
```

- [ ] **Step 2: Commit (bundled into Task 8's commit)**

(Held — committed with SetupService below.)

---

## Task 8: SetupService with failing tests

**Files:**

- Create: `apps/cascade-api/src/setup/setup.service.spec.ts`
- Create: `apps/cascade-api/src/setup/setup.service.ts`

- [ ] **Step 1: Write failing tests**

`apps/cascade-api/src/setup/setup.service.spec.ts`:

```ts
import { jest } from '@jest/globals';
import { Test, type TestingModule } from '@nestjs/testing';
import argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service.js';
import { AlreadyInitializedError, ConcurrentSetupError } from './setup.errors.js';
import { SetupService } from './setup.service.js';

interface MockTx {
  user: {
    count: jest.Mock<() => Promise<number>>;
    create: jest.Mock<
      (args: { data: { email: string; passwordHash: string; role: string } }) => Promise<{
        id: string;
        email: string;
      }>
    >;
  };
  instanceSecret: {
    findUnique: jest.Mock<(args: { where: { key: string } }) => Promise<{ key: string } | null>>;
    create: jest.Mock<(args: { data: { key: string; value: string } }) => Promise<{ key: string }>>;
  };
  $queryRaw: jest.Mock<(...args: unknown[]) => Promise<Array<{ locked: boolean }>>>;
}

function buildTx(): MockTx {
  return {
    user: {
      count: jest.fn<() => Promise<number>>(),
      create: jest.fn(),
    },
    instanceSecret: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };
}

describe('SetupService', () => {
  let tx: MockTx;
  let service: SetupService;
  const userCountTop = jest.fn<() => Promise<number>>();

  beforeEach(async () => {
    tx = buildTx();
    userCountTop.mockReset();
    const prisma = {
      user: { count: userCountTop },
      $transaction: <T>(fn: (t: unknown) => Promise<T>): Promise<T> => fn(tx),
    } as unknown as PrismaService;
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [SetupService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(SetupService);
  });

  describe('status', () => {
    it('returns needsSetup true when no user exists', async () => {
      userCountTop.mockResolvedValueOnce(0);
      await expect(service.status()).resolves.toEqual({ needsSetup: true });
    });

    it('returns needsSetup false when a user exists', async () => {
      userCountTop.mockResolvedValueOnce(1);
      await expect(service.status()).resolves.toEqual({ needsSetup: false });
    });
  });

  describe('initialize', () => {
    const body = { email: 'admin@example.com', password: 'correct-horse-1' };

    it('hashes password, creates user, and inserts both InstanceSecret rows', async () => {
      tx.$queryRaw.mockResolvedValueOnce([{ locked: true }]);
      tx.user.count.mockResolvedValueOnce(0);
      tx.user.create.mockResolvedValueOnce({ id: 'u1', email: body.email });
      tx.instanceSecret.findUnique.mockResolvedValue(null);
      tx.instanceSecret.create.mockResolvedValue({ key: 'JWT_SECRET' });

      const result = await service.initialize(body);

      expect(result).toEqual({ id: 'u1', email: body.email });
      const createArgs = tx.user.create.mock.calls[0]?.[0];
      expect(createArgs?.data.email).toBe(body.email);
      expect(createArgs?.data.role).toBe('admin');
      await expect(argon2.verify(createArgs?.data.passwordHash ?? '', body.password)).resolves.toBe(
        true,
      );
      expect(tx.instanceSecret.create).toHaveBeenCalledTimes(2);
      const createdKeys = tx.instanceSecret.create.mock.calls.map((c) => c[0].data.key);
      expect(createdKeys.sort()).toEqual(['CREDENTIALS_ENC_KEY', 'JWT_SECRET']);
      for (const c of tx.instanceSecret.create.mock.calls) {
        expect(c[0].data.value).toMatch(/^[0-9a-f]{64}$/);
      }
    });

    it('throws AlreadyInitializedError when a user already exists', async () => {
      tx.$queryRaw.mockResolvedValueOnce([{ locked: true }]);
      tx.user.count.mockResolvedValueOnce(1);
      await expect(service.initialize(body)).rejects.toBeInstanceOf(AlreadyInitializedError);
      expect(tx.user.create).not.toHaveBeenCalled();
    });

    it('throws ConcurrentSetupError when the advisory lock is not acquired', async () => {
      tx.$queryRaw.mockResolvedValueOnce([{ locked: false }]);
      await expect(service.initialize(body)).rejects.toBeInstanceOf(ConcurrentSetupError);
      expect(tx.user.count).not.toHaveBeenCalled();
    });

    it('skips creating an InstanceSecret row that already exists', async () => {
      tx.$queryRaw.mockResolvedValueOnce([{ locked: true }]);
      tx.user.count.mockResolvedValueOnce(0);
      tx.user.create.mockResolvedValueOnce({ id: 'u1', email: body.email });
      tx.instanceSecret.findUnique.mockImplementation(({ where }) =>
        Promise.resolve(where.key === 'JWT_SECRET' ? { key: 'JWT_SECRET' } : null),
      );
      tx.instanceSecret.create.mockResolvedValue({ key: 'CREDENTIALS_ENC_KEY' });

      await service.initialize(body);

      expect(tx.instanceSecret.create).toHaveBeenCalledTimes(1);
      expect(tx.instanceSecret.create.mock.calls[0]?.[0].data.key).toBe('CREDENTIALS_ENC_KEY');
    });
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `pnpm --filter cascade-api test -- setup.service.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement SetupService**

`apps/cascade-api/src/setup/setup.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { SECRET_KEYS, type SecretKey } from '../secrets/secret-key.js';
import type { SetupBody } from './dto.js';
import { AlreadyInitializedError, ConcurrentSetupError } from './setup.errors.js';

const SETUP_LOCK_ID = 0x6caa11ddn; // chosen constant; same value every call so all setup TXs contend

interface LockRow {
  locked: boolean;
}

interface MinimalUserClient {
  count(): Promise<number>;
  create(args: {
    data: { email: string; passwordHash: string; role: string };
  }): Promise<{ id: string; email: string }>;
}

interface MinimalInstanceSecretClient {
  findUnique(args: { where: { key: string } }): Promise<{ key: string } | null>;
  create(args: { data: { key: string; value: string } }): Promise<{ key: string }>;
}

interface MinimalTx {
  user: MinimalUserClient;
  instanceSecret: MinimalInstanceSecretClient;
  $queryRaw(strings: TemplateStringsArray, ...values: unknown[]): Promise<LockRow[]>;
}

@Injectable()
export class SetupService {
  constructor(private readonly prisma: PrismaService) {}

  async status(): Promise<{ needsSetup: boolean }> {
    const count = await this.prisma.user.count();
    return { needsSetup: count === 0 };
  }

  async initialize(body: SetupBody): Promise<{ id: string; email: string }> {
    return this.prisma.$transaction(async (tx) => {
      const t = tx as unknown as MinimalTx;
      const lockRows =
        await t.$queryRaw`SELECT pg_try_advisory_xact_lock(${SETUP_LOCK_ID}) AS locked`;
      const locked = lockRows[0]?.locked === true;
      if (!locked) {
        throw new ConcurrentSetupError();
      }
      const existing = await t.user.count();
      if (existing > 0) {
        throw new AlreadyInitializedError();
      }
      const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
      const user = await t.user.create({
        data: { email: body.email, passwordHash, role: 'admin' },
      });
      for (const key of SECRET_KEYS as readonly SecretKey[]) {
        const row = await t.instanceSecret.findUnique({ where: { key } });
        if (row !== null) continue;
        await t.instanceSecret.create({
          data: { key, value: randomBytes(32).toString('hex') },
        });
      }
      return { id: user.id, email: user.email };
    });
  }
}
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter cascade-api test -- setup.service.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cascade-api/src/setup/setup.errors.ts apps/cascade-api/src/setup/setup.service.ts apps/cascade-api/src/setup/setup.service.spec.ts
git commit -s -m "feat(api): SetupService — admin creation + secret seeding"
```

---

## Task 9: Setup exception filter

**Files:**

- Create: `apps/cascade-api/src/setup/setup.exception-filter.ts`

- [ ] **Step 1: Write the filter**

```ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AlreadyInitializedError, ConcurrentSetupError } from './setup.errors.js';

@Catch(AlreadyInitializedError, ConcurrentSetupError)
export class SetupExceptionFilter
  implements ExceptionFilter<AlreadyInitializedError | ConcurrentSetupError>
{
  catch(exception: AlreadyInitializedError | ConcurrentSetupError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof AlreadyInitializedError) {
      res.status(HttpStatus.GONE).json({ error: 'ALREADY_INITIALIZED' });
      return;
    }
    res.status(HttpStatus.CONFLICT).json({ error: 'CONCURRENT_SETUP' });
  }
}
```

- [ ] **Step 2: Commit (bundled into Task 10)**

(Committed alongside the controller.)

---

## Task 10: SetupController with failing tests

**Files:**

- Create: `apps/cascade-api/src/setup/setup.controller.spec.ts`
- Create: `apps/cascade-api/src/setup/setup.controller.ts`

- [ ] **Step 1: Write failing tests**

`apps/cascade-api/src/setup/setup.controller.spec.ts`:

```ts
import { jest } from '@jest/globals';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { SetupController } from './setup.controller.js';
import { AlreadyInitializedError } from './setup.errors.js';
import { SetupService } from './setup.service.js';

describe('SetupController', () => {
  const status = jest.fn<() => Promise<{ needsSetup: boolean }>>();
  const initialize =
    jest.fn<
      (body: { email: string; password: string }) => Promise<{ id: string; email: string }>
    >();
  let controller: SetupController;

  beforeEach(async () => {
    status.mockReset();
    initialize.mockReset();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SetupController],
      providers: [{ provide: SetupService, useValue: { status, initialize } }],
    }).compile();
    controller = moduleRef.get(SetupController);
  });

  describe('GET /setup', () => {
    it('returns the form schema when needsSetup is true', async () => {
      status.mockResolvedValueOnce({ needsSetup: true });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as {
        status: jest.Mock;
        json: jest.Mock;
      };
      await controller.get(res as never);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        needsSetup: true,
        fields: [
          { name: 'email', type: 'email' },
          { name: 'password', type: 'password', minLength: 12 },
        ],
      });
    });

    it('returns 410 when setup is already complete', async () => {
      status.mockResolvedValueOnce({ needsSetup: false });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as {
        status: jest.Mock;
        json: jest.Mock;
      };
      await controller.get(res as never);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.GONE);
      expect(res.json).toHaveBeenCalledWith({ needsSetup: false });
    });
  });

  describe('POST /setup', () => {
    it('returns 201 with id+email on success', async () => {
      initialize.mockResolvedValueOnce({ id: 'u1', email: 'admin@example.com' });
      const out = await controller.post({
        email: 'admin@example.com',
        password: 'correct-horse-1',
      });
      expect(out).toEqual({ id: 'u1', email: 'admin@example.com' });
    });

    it('throws BadRequestException on validation failure', async () => {
      await expect(
        controller.post({ email: 'nope', password: 'short' } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(initialize).not.toHaveBeenCalled();
    });

    it('propagates AlreadyInitializedError for the filter to handle', async () => {
      initialize.mockRejectedValueOnce(new AlreadyInitializedError());
      await expect(
        controller.post({ email: 'admin@example.com', password: 'correct-horse-1' }),
      ).rejects.toBeInstanceOf(AlreadyInitializedError);
    });
  });
});
```

- [ ] **Step 2: Run, verify fail**

Run: `pnpm --filter cascade-api test -- setup.controller.spec.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement controller**

`apps/cascade-api/src/setup/setup.controller.ts`:

```ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseFilters,
} from '@nestjs/common';
import type { Response } from 'express';
import { SetupBodySchema, type SetupBody } from './dto.js';
import { SetupExceptionFilter } from './setup.exception-filter.js';
import { SetupService } from './setup.service.js';

@Controller('setup')
@UseFilters(SetupExceptionFilter)
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get()
  async get(@Res({ passthrough: false }) res: Response): Promise<void> {
    const { needsSetup } = await this.setupService.status();
    if (!needsSetup) {
      res.status(HttpStatus.GONE).json({ needsSetup: false });
      return;
    }
    res.status(HttpStatus.OK).json({
      needsSetup: true,
      fields: [
        { name: 'email', type: 'email' },
        { name: 'password', type: 'password', minLength: 12 },
      ],
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async post(@Body() body: unknown): Promise<{ id: string; email: string }> {
    const parsed = SetupBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'VALIDATION',
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
          code: i.code,
        })),
      });
    }
    const validated: SetupBody = parsed.data;
    return this.setupService.initialize(validated);
  }
}
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter cascade-api test -- setup.controller.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/cascade-api/src/setup/setup.controller.ts apps/cascade-api/src/setup/setup.controller.spec.ts apps/cascade-api/src/setup/setup.exception-filter.ts
git commit -s -m "feat(api): SetupController + exception filter for /setup"
```

---

## Task 11: SetupModule

**Files:**

- Create: `apps/cascade-api/src/setup/setup.module.ts`

- [ ] **Step 1: Write the module**

```ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SetupController } from './setup.controller.js';
import { SetupService } from './setup.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [SetupController],
  providers: [SetupService],
})
export class SetupModule {}
```

- [ ] **Step 2: Commit (bundled with AppModule wiring)**

(Held until Task 12.)

---

## Task 12: Wire modules into AppModule

**Files:**

- Modify: `apps/cascade-api/src/app.module.ts`

- [ ] **Step 1: Edit AppModule**

Replace the file with:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { SecretModule } from './secrets/secret.module.js';
import { SetupModule } from './setup/setup.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    SecretModule,
    SetupModule,
    HealthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Run typecheck and unit tests**

Run: `pnpm --filter cascade-api typecheck && pnpm --filter cascade-api test`
Expected: typecheck clean, all unit tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/cascade-api/src/setup/setup.module.ts apps/cascade-api/src/app.module.ts
git commit -s -m "feat(api): mount SetupModule and SecretModule in AppModule"
```

---

## Task 13: Integration tests (Testcontainers)

**Files:**

- Create: `apps/cascade-api-e2e/src/setup.e2e-spec.ts`

- [ ] **Step 1: Write the integration spec**

```ts
import type { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../../cascade-api/src/app.module.js';
import { PrismaService } from '../../cascade-api/src/prisma/prisma.service.js';
import { SecretService } from '../../cascade-api/src/secrets/secret.service.js';
import { type BackingServices, startBackingServices, stopBackingServices } from './containers.js';

describe('/setup (integration)', () => {
  let services: BackingServices;
  let app: INestApplication;
  let prisma: PrismaService;
  let secretService: SecretService;

  beforeAll(async () => {
    services = await startBackingServices();
    process.env.DATABASE_URL = services.databaseUrl;
    process.env.REDIS_URL = services.redisUrl;
    delete process.env.JWT_SECRET;
    delete process.env.CREDENTIALS_ENC_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = moduleFixture.get(PrismaService);
    secretService = moduleFixture.get(SecretService);
  });

  afterAll(async () => {
    await app.close();
    await stopBackingServices(services);
  });

  beforeEach(async () => {
    await prisma.instanceSecret.deleteMany();
    await prisma.user.deleteMany();
    delete process.env.JWT_SECRET;
    delete process.env.CREDENTIALS_ENC_KEY;
    // Reset the SecretService cache by reaching into private state — the
    // service is otherwise long-lived for the whole app instance.
    (secretService as unknown as { cache: Map<string, string> }).cache.clear();
  });

  it('GET /setup returns 200 with form schema when no admin exists', async () => {
    const response = await request(app.getHttpServer()).get('/setup');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      needsSetup: true,
      fields: [
        { name: 'email', type: 'email' },
        { name: 'password', type: 'password', minLength: 12 },
      ],
    });
  });

  it('POST /setup creates the admin and seeds both InstanceSecret rows', async () => {
    const response = await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: expect.any(String),
      email: 'admin@example.com',
    });

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(1);
    expect(users[0].role).toBe('admin');
    await expect(argon2.verify(users[0].passwordHash, 'correct-horse-1')).resolves.toBe(true);

    const secrets = await prisma.instanceSecret.findMany({ orderBy: { key: 'asc' } });
    expect(secrets.map((s) => s.key)).toEqual(['CREDENTIALS_ENC_KEY', 'JWT_SECRET']);
    for (const s of secrets) {
      expect(s.value).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('GET /setup returns 410 after the admin exists', async () => {
    await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1' });
    const response = await request(app.getHttpServer()).get('/setup');
    expect(response.status).toBe(410);
    expect(response.body).toEqual({ needsSetup: false });
  });

  it('POST /setup a second time returns 410 ALREADY_INITIALIZED', async () => {
    await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1' });
    const response = await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'other@example.com', password: 'correct-horse-2' });
    expect(response.status).toBe(410);
    expect(response.body).toEqual({ error: 'ALREADY_INITIALIZED' });
  });

  it('POST /setup with a short password returns 400 VALIDATION', async () => {
    const response = await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'short' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION');
    expect(Array.isArray(response.body.issues)).toBe(true);
    const users = await prisma.user.findMany();
    expect(users).toHaveLength(0);
  });

  it('POST /setup with an extra key returns 400 VALIDATION (strict mode)', async () => {
    const response = await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1', role: 'super' });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('VALIDATION');
  });

  it('parallel POST /setup yields exactly one 201 and one User row', async () => {
    const promises = Array.from({ length: 8 }, (_, i) =>
      request(app.getHttpServer())
        .post('/setup')
        .send({ email: `admin${i}@example.com`, password: 'correct-horse-1' }),
    );
    const responses = await Promise.all(promises);
    const successes = responses.filter((r) => r.status === 201);
    const rejected = responses.filter((r) => r.status === 410 || r.status === 409);
    expect(successes).toHaveLength(1);
    expect(rejected.length).toBe(responses.length - 1);

    const users = await prisma.user.findMany();
    expect(users).toHaveLength(1);
    const secrets = await prisma.instanceSecret.findMany();
    expect(secrets).toHaveLength(2);
  });

  it('with JWT_SECRET preset in env, both DB rows are still written and env wins on read', async () => {
    process.env.JWT_SECRET = 'env-supplied-jwt';
    await request(app.getHttpServer())
      .post('/setup')
      .send({ email: 'admin@example.com', password: 'correct-horse-1' });
    const secrets = await prisma.instanceSecret.findMany({ orderBy: { key: 'asc' } });
    expect(secrets.map((s) => s.key)).toEqual(['CREDENTIALS_ENC_KEY', 'JWT_SECRET']);
    await expect(secretService.get('JWT_SECRET')).resolves.toBe('env-supplied-jwt');
  });
});
```

- [ ] **Step 2: Run the integration spec**

Run: `pnpm --filter cascade-api-e2e test -- setup.e2e-spec.ts`
Expected: PASS (8 specs). First run may take 30-60s for Postgres container pull.

- [ ] **Step 3: Commit**

```bash
git add apps/cascade-api-e2e/src/setup.e2e-spec.ts
git commit -s -m "test(api-e2e): integration coverage for /setup (Testcontainers)"
```

---

## Task 14: Final verification + PR

- [ ] **Step 1: Run full check matrix**

Run:

```bash
pnpm --filter cascade-api lint
pnpm --filter cascade-api typecheck
pnpm --filter cascade-api test
pnpm --filter cascade-api-e2e test
```

Expected: all green, coverage on the new files ≥ 90% (cascade-api floor).

- [ ] **Step 2: Push branch**

```bash
git push -u origin worktree-b-api-auth-setup
```

- [ ] **Step 3: Open PR into develop**

```bash
gh pr create --base develop --title "feat(api): first-boot setup wizard (#10)" --body "$(cat <<'EOF'
## Summary

- Adds `POST /setup` to create the single admin (`User`) and seed `InstanceSecret` rows for `JWT_SECRET` and `CREDENTIALS_ENC_KEY`.
- Adds `GET /setup` returning the form schema, then `410 Gone` after setup runs.
- Adds `SecretService` — env-first with DB fallback, cached.

Closes #10.

## Test plan

- [ ] `pnpm --filter cascade-api test` (unit, 90% coverage floor)
- [ ] `pnpm --filter cascade-api-e2e test` (Testcontainers — Postgres + Redis)
- [ ] `pnpm --filter cascade-api lint && pnpm --filter cascade-api typecheck`

## Design doc

`docs/superpowers/specs/2026-05-26-b-api-auth-setup-design.md`
EOF
)"
```

Expected: PR URL printed.

---

## Self-Review (done before publishing this plan)

- **Spec coverage:** Each spec section maps to a task — data model (1), argon2 (2), SecretService (3-5), DTO (6), SetupService (7-8), filter (9), controller (10), module wiring (11-12), integration tests (13), verification (14).
- **Placeholders:** none.
- **Type consistency:** `SecretKey` defined once and reused; `SetupBody` used by controller; transaction mock type matches the real shape.
- **Out-of-scope items** (JWT issuance, credential encryption, web wizard) explicitly NOT in any task — they have their own issues.
