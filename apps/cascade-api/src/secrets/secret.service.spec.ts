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
});
