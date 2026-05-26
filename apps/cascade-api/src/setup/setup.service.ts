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
