import { jest } from '@jest/globals';
import { Test, type TestingModule } from '@nestjs/testing';
import { Prisma } from '../../prisma/generated/client/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { WorkflowAlreadyExistsError, WorkflowNotFoundError } from './workflow.errors.js';
import { WorkflowService } from './workflow.service.js';

const baseDef = {
  schemaVersion: '1.0.0',
  id: 'wf-1',
  name: 'Sample',
  nodes: [{ id: 'n1', type: 'http' as const, config: {} }],
  edges: [],
  triggers: [],
};

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'wf-1',
    name: 'Sample',
    schemaVersion: '1.0.0',
    definition: baseDef as unknown as Prisma.JsonValue,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

interface MockPrisma {
  workflow: {
    create: jest.Mock<(args: unknown) => Promise<unknown>>;
    findMany: jest.Mock<(args: unknown) => Promise<unknown[]>>;
    findUnique: jest.Mock<(args: unknown) => Promise<unknown>>;
    update: jest.Mock<(args: unknown) => Promise<unknown>>;
    delete: jest.Mock<(args: unknown) => Promise<unknown>>;
    count: jest.Mock<() => Promise<number>>;
  };
  $transaction: jest.Mock<(ops: unknown[]) => Promise<unknown[]>>;
}

describe('WorkflowService', () => {
  let prisma: MockPrisma;
  let service: WorkflowService;

  beforeEach(async () => {
    prisma = {
      workflow: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [WorkflowService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(WorkflowService);
  });

  describe('create', () => {
    it('persists the workflow and returns the detail view', async () => {
      prisma.workflow.create.mockResolvedValueOnce(makeRow());
      const result = await service.create(baseDef);
      expect(result.id).toBe('wf-1');
      expect(result.definition).toEqual(baseDef);
      expect(prisma.workflow.create).toHaveBeenCalledWith({
        data: {
          id: 'wf-1',
          name: 'Sample',
          schemaVersion: '1.0.0',
          definition: baseDef,
        },
      });
    });

    it('maps P2002 unique-violation to WorkflowAlreadyExistsError', async () => {
      prisma.workflow.create.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('unique violation', {
          code: 'P2002',
          clientVersion: '6.0.0',
        }),
      );
      await expect(service.create(baseDef)).rejects.toBeInstanceOf(WorkflowAlreadyExistsError);
    });

    it('rethrows unknown errors', async () => {
      prisma.workflow.create.mockRejectedValueOnce(new Error('boom'));
      await expect(service.create(baseDef)).rejects.toThrow('boom');
    });
  });

  describe('findAll', () => {
    it('returns items + total', async () => {
      prisma.$transaction.mockResolvedValueOnce([
        [
          {
            id: 'wf-1',
            name: 'Sample',
            schemaVersion: '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        1,
      ]);
      const result = await service.findAll({ limit: 20, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns the workflow detail when found', async () => {
      prisma.workflow.findUnique.mockResolvedValueOnce(makeRow());
      const result = await service.findOne('wf-1');
      expect(result.id).toBe('wf-1');
    });

    it('throws WorkflowNotFoundError when missing', async () => {
      prisma.workflow.findUnique.mockResolvedValueOnce(null);
      await expect(service.findOne('missing')).rejects.toBeInstanceOf(WorkflowNotFoundError);
    });
  });

  describe('update', () => {
    it('partially updates the name', async () => {
      prisma.workflow.update.mockResolvedValueOnce(makeRow({ name: 'New' }));
      const result = await service.update('wf-1', { name: 'New' });
      expect(result.name).toBe('New');
      expect(prisma.workflow.update).toHaveBeenCalledWith({
        where: { id: 'wf-1' },
        data: { name: 'New' },
      });
    });

    it('updates the definition and bumps schemaVersion to match', async () => {
      const bumped = { ...baseDef, schemaVersion: '1.1.0' };
      prisma.workflow.update.mockResolvedValueOnce(
        makeRow({ schemaVersion: '1.1.0', definition: bumped as unknown as Prisma.JsonValue }),
      );
      await service.update('wf-1', { definition: bumped });
      expect(prisma.workflow.update).toHaveBeenCalledWith({
        where: { id: 'wf-1' },
        data: { definition: bumped, schemaVersion: '1.1.0' },
      });
    });

    it('maps P2025 to WorkflowNotFoundError', async () => {
      prisma.workflow.update.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('row not found', {
          code: 'P2025',
          clientVersion: '6.0.0',
        }),
      );
      await expect(service.update('missing', { name: 'X' })).rejects.toBeInstanceOf(
        WorkflowNotFoundError,
      );
    });

    it('rethrows unknown errors', async () => {
      prisma.workflow.update.mockRejectedValueOnce(new Error('boom'));
      await expect(service.update('wf-1', { name: 'N' })).rejects.toThrow('boom');
    });
  });

  describe('remove', () => {
    it('deletes the row', async () => {
      prisma.workflow.delete.mockResolvedValueOnce(undefined);
      await service.remove('wf-1');
      expect(prisma.workflow.delete).toHaveBeenCalledWith({ where: { id: 'wf-1' } });
    });

    it('maps P2025 to WorkflowNotFoundError', async () => {
      prisma.workflow.delete.mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('row not found', {
          code: 'P2025',
          clientVersion: '6.0.0',
        }),
      );
      await expect(service.remove('missing')).rejects.toBeInstanceOf(WorkflowNotFoundError);
    });

    it('rethrows unknown errors', async () => {
      prisma.workflow.delete.mockRejectedValueOnce(new Error('boom'));
      await expect(service.remove('wf-1')).rejects.toThrow('boom');
    });
  });
});
