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
  private readonly cache = new Map<SecretKey, Promise<string>>();

  constructor(private readonly prisma: PrismaService) {}

  get(key: SecretKey): Promise<string> {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    const resolved = this.resolve(key);
    this.cache.set(key, resolved);
    resolved.catch(() => this.cache.delete(key));
    return resolved;
  }

  private async resolve(key: SecretKey): Promise<string> {
    const env = process.env[key];
    if (env !== undefined && env.length > 0) {
      return env;
    }
    const row = await this.prisma.instanceSecret.findUnique({ where: { key } });
    if (row === null) {
      throw new SecretNotInitializedError(key);
    }
    return row.value;
  }
}
