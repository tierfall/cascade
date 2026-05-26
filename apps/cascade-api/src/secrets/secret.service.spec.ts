import { jest } from '@jest/globals';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { SecretNotInitializedError, SecretService } from './secret.service.js';

interface InstanceSecretRow {
  key: string;
  value: string;
  createdAt: Date;
}
interface FindUniqueArgs {
  where: { key: string };
}

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

  it('caches env-sourced values — second get after env change still returns the cached value', async () => {
    process.env.JWT_SECRET = 'env-jwt';
    await expect(service.get('JWT_SECRET')).resolves.toBe('env-jwt');
    process.env.JWT_SECRET = 'rotated';
    await expect(service.get('JWT_SECRET')).resolves.toBe('env-jwt');
  });

  it('coalesces concurrent uncached gets — one DB call across N parallel readers', async () => {
    let resolveFn: (value: InstanceSecretRow) => void = () => undefined;
    findUnique.mockImplementationOnce(
      () =>
        new Promise<InstanceSecretRow>((resolve) => {
          resolveFn = resolve;
        }),
    );
    const a = service.get('JWT_SECRET');
    const b = service.get('JWT_SECRET');
    const c = service.get('JWT_SECRET');
    expect(findUnique).toHaveBeenCalledTimes(1);
    resolveFn({ key: 'JWT_SECRET', value: 'shared', createdAt: new Date() });
    await expect(Promise.all([a, b, c])).resolves.toEqual(['shared', 'shared', 'shared']);
  });

  it('evicts the cache when DB fetch rejects so the next call retries', async () => {
    findUnique.mockRejectedValueOnce(new Error('db down'));
    await expect(service.get('JWT_SECRET')).rejects.toThrow('db down');
    findUnique.mockResolvedValueOnce({
      key: 'JWT_SECRET',
      value: 'recovered',
      createdAt: new Date(),
    });
    await expect(service.get('JWT_SECRET')).resolves.toBe('recovered');
    expect(findUnique).toHaveBeenCalledTimes(2);
  });
});
