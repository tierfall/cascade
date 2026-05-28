import { Test } from '@nestjs/testing';
import { LocalFsStorage } from './local-fs-storage.js';
import { S3Storage } from './s3-storage.js';
import type { StorageProvider } from './storage-provider.js';
import { STORAGE_PROVIDER, StorageModule } from './storage.module.js';

async function build(envOverrides: Record<string, string | undefined>): Promise<StorageProvider> {
  const originals = new Map<string, string | undefined>();
  for (const [k, v] of Object.entries(envOverrides)) {
    originals.set(k, process.env[k]);
    if (v === undefined) {
      process.env[k] = '';
      // setting to empty string mimics 'unset' for our factory's purposes
    } else {
      process.env[k] = v;
    }
  }
  try {
    const mod = await Test.createTestingModule({ imports: [StorageModule] }).compile();
    return mod.get<StorageProvider>(STORAGE_PROVIDER);
  } finally {
    for (const [k, v] of originals) {
      if (v === undefined) {
        process.env[k] = '';
      } else {
        process.env[k] = v;
      }
    }
  }
}

describe('StorageModule factory', () => {
  it('returns LocalFsStorage when STORAGE_DRIVER is unset', async () => {
    const storage = await build({ STORAGE_DRIVER: undefined, STORAGE_LOCAL_DIR: '/tmp/x' });
    expect(storage).toBeInstanceOf(LocalFsStorage);
  });

  it('returns LocalFsStorage when STORAGE_DRIVER=local', async () => {
    const storage = await build({ STORAGE_DRIVER: 'local', STORAGE_LOCAL_DIR: '/tmp/x' });
    expect(storage).toBeInstanceOf(LocalFsStorage);
  });

  it('returns S3Storage when STORAGE_DRIVER=s3 with a bucket', async () => {
    const storage = await build({
      STORAGE_DRIVER: 's3',
      STORAGE_S3_BUCKET: 'b',
      AWS_REGION: 'us-east-1',
    });
    expect(storage).toBeInstanceOf(S3Storage);
  });

  it('throws when STORAGE_DRIVER=s3 without STORAGE_S3_BUCKET', async () => {
    await expect(build({ STORAGE_DRIVER: 's3', STORAGE_S3_BUCKET: undefined })).rejects.toThrow(
      /STORAGE_S3_BUCKET/,
    );
  });

  it('throws on unknown STORAGE_DRIVER', async () => {
    await expect(build({ STORAGE_DRIVER: 'memory' })).rejects.toThrow(/unknown STORAGE_DRIVER/);
  });
});
