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
