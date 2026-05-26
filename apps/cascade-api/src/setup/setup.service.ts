import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';
import { randomBytes } from 'node:crypto';
import { Prisma } from '../../prisma/generated/client/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SECRET_KEYS, type SecretKey } from '../secrets/secret-key.js';
import type { SetupBody } from './dto.js';
import { AlreadyInitializedError, ConcurrentSetupError } from './setup.errors.js';

// Postgres pg_try_advisory_xact_lock takes a signed bigint; the spec's
// 0xCA5CADE5E70705E7 overflows signed int64, so we use a smaller fixed
// constant. Any other caller using a different value will not contend.
const SETUP_LOCK_ID = 0x6caa11ddn;

interface LockRow {
  locked: boolean;
}

@Injectable()
export class SetupService {
  constructor(private readonly prisma: PrismaService) {}

  async status(): Promise<{ needsSetup: boolean }> {
    const count = await this.prisma.user.count();
    return { needsSetup: count === 0 };
  }

  async initialize(body: SetupBody): Promise<{ id: string; email: string }> {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const lockRows = await tx.$queryRaw<
        LockRow[]
      >`SELECT pg_try_advisory_xact_lock(${SETUP_LOCK_ID}) AS locked`;
      const locked = lockRows[0]?.locked === true;
      if (!locked) {
        throw new ConcurrentSetupError();
      }
      const existing = await tx.user.count();
      if (existing > 0) {
        throw new AlreadyInitializedError();
      }
      const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id });
      const user = await tx.user.create({
        data: { email: body.email, passwordHash, role: 'admin' },
      });
      for (const key of SECRET_KEYS as readonly SecretKey[]) {
        const row = await tx.instanceSecret.findUnique({ where: { key } });
        if (row !== null) continue;
        await tx.instanceSecret.create({
          data: { key, value: randomBytes(32).toString('hex') },
        });
      }
      return { id: user.id, email: user.email };
    });
  }
}
