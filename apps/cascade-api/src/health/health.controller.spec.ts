import { jest } from '@jest/globals';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  const queryRawMock = jest.fn<() => Promise<unknown>>();

  beforeEach(async () => {
    queryRawMock.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: { $queryRaw: queryRawMock } }],
    }).compile();
    controller = module.get(HealthController);
  });

  it('returns status ok when DB responds', async () => {
    queryRawMock.mockResolvedValueOnce([{ one: 1 }]);
    expect(await controller.check()).toEqual({ status: 'ok' });
  });

  it('returns status degraded when DB throws', async () => {
    queryRawMock.mockRejectedValueOnce(new Error('boom'));
    expect(await controller.check()).toEqual({ status: 'degraded' });
  });
});
