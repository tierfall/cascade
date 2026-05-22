import { jest } from '@jest/globals';
import { PrismaService } from './prisma.service.js';

// Mock PrismaClient at the module level so PrismaService constructor doesn't try to connect.
jest.mock('../../prisma/generated/client/index.js', () => {
  const connectMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  const disconnectMock = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: connectMock,
      $disconnect: disconnectMock,
    })),
  };
});

describe('PrismaService', () => {
  let service: PrismaService;
  let connectSpy: ReturnType<typeof jest.fn>;
  let disconnectSpy: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    const { PrismaClient } = await import('../../prisma/generated/client/index.js');
    const instance = new (PrismaClient as any)();
    connectSpy = instance.$connect;
    disconnectSpy = instance.$disconnect;
    service = new PrismaService();
    (service as any).$connect = connectSpy;
    (service as any).$disconnect = disconnectSpy;
  });

  it('calls $connect on module init', async () => {
    await service.onModuleInit();
    expect(connectSpy).toHaveBeenCalledTimes(1);
  });

  it('calls $disconnect on module destroy', async () => {
    await service.onModuleDestroy();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
