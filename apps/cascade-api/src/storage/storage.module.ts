import { Module } from '@nestjs/common';
import { LocalFsStorage } from './local-fs-storage.js';
import { S3Storage } from './s3-storage.js';
import type { StorageProvider } from './storage-provider.js';

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

function env(key: string): string | undefined {
  const value = process.env[key];
  return value !== undefined && value.length > 0 ? value : undefined;
}

function buildStorage(): StorageProvider {
  const driver = env('STORAGE_DRIVER') ?? 'local';
  if (driver === 's3') {
    const bucket = env('STORAGE_S3_BUCKET');
    if (bucket === undefined) {
      throw new Error('STORAGE_DRIVER=s3 requires STORAGE_S3_BUCKET');
    }
    const region = env('AWS_REGION') ?? 'us-east-1';
    const endpoint = env('STORAGE_S3_ENDPOINT');
    const accessKeyId = env('AWS_ACCESS_KEY_ID');
    const secretAccessKey = env('AWS_SECRET_ACCESS_KEY');
    return new S3Storage({
      bucket,
      region,
      ...(endpoint !== undefined ? { endpoint } : {}),
      ...(env('STORAGE_S3_FORCE_PATH_STYLE') === 'true' ? { forcePathStyle: true } : {}),
      ...(accessKeyId !== undefined ? { accessKeyId } : {}),
      ...(secretAccessKey !== undefined ? { secretAccessKey } : {}),
    });
  }
  if (driver === 'local') {
    const rootDir = env('STORAGE_LOCAL_DIR') ?? '/data/storage';
    return new LocalFsStorage(rootDir);
  }
  throw new Error(`unknown STORAGE_DRIVER '${driver}' (expected 'local' or 's3')`);
}

@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER,
      useFactory: buildStorage,
    },
  ],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
