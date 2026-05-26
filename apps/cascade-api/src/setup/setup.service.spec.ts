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
  $queryRaw: jest.Mock<(...args: unknown[]) => Promise<{ locked: boolean }[]>>;
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
  let transactionMock: jest.Mock<<T>(fn: (t: unknown) => Promise<T>) => Promise<T>>;
  const userCountTop = jest.fn<() => Promise<number>>();

  beforeEach(async () => {
    tx = buildTx();
    userCountTop.mockReset();
    transactionMock = jest.fn(<T>(fn: (t: unknown) => Promise<T>): Promise<T> => fn(tx));
    const prisma = {
      user: { count: userCountTop },
      $transaction: transactionMock,
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

      expect(transactionMock).toHaveBeenCalledTimes(1);
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
