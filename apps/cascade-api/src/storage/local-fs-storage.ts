import { Injectable } from '@nestjs/common';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, normalize, resolve } from 'node:path';
import type { GetObjectResult, PutObjectInput, StorageProvider } from './storage-provider.js';

@Injectable()
export class LocalFsStorage implements StorageProvider {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = resolve(rootDir);
  }

  async put(input: PutObjectInput): Promise<void> {
    const path = this.resolveKey(input.key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, new Uint8Array(input.body));
    if (input.contentType !== undefined) {
      await writeFile(`${path}.content-type`, input.contentType, 'utf8');
    }
  }

  async get(key: string): Promise<GetObjectResult | null> {
    const path = this.resolveKey(key);
    try {
      const body = await readFile(path);
      let contentType: string | undefined;
      try {
        contentType = await readFile(`${path}.content-type`, 'utf8');
      } catch {
        contentType = undefined;
      }
      return contentType === undefined ? { body } : { body, contentType };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    const path = this.resolveKey(key);
    await rm(path, { force: true });
    await rm(`${path}.content-type`, { force: true });
  }

  async exists(key: string): Promise<boolean> {
    const path = this.resolveKey(key);
    try {
      await stat(path);
      return true;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw err;
    }
  }

  private resolveKey(key: string): string {
    const normalized = normalize(key);
    if (normalized.startsWith('..') || normalized.includes('../')) {
      throw new Error(`storage key escapes root directory: ${key}`);
    }
    const candidate = resolve(join(this.rootDir, normalized));
    if (!candidate.startsWith(`${this.rootDir}/`) && candidate !== this.rootDir) {
      throw new Error(`storage key escapes root directory: ${key}`);
    }
    return candidate;
  }
}
