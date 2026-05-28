import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller.js';
import { WorkflowService } from './workflow.service.js';

const validDefinition = {
  schemaVersion: '1.0.0',
  id: 'wf-1',
  name: 'Sample',
  nodes: [{ id: 'n1', type: 'http', config: {} }],
  edges: [],
  triggers: [],
};

describe('WorkflowController', () => {
  const create = jest.fn<(body: unknown) => Promise<unknown>>();
  const findAll = jest.fn<(query: unknown) => Promise<{ items: unknown[]; total: number }>>();
  const findOne = jest.fn<(id: string) => Promise<unknown>>();
  const update = jest.fn<(id: string, body: unknown) => Promise<unknown>>();
  const remove = jest.fn<(id: string) => Promise<void>>();
  let controller: WorkflowController;

  beforeEach(async () => {
    create.mockReset();
    findAll.mockReset();
    findOne.mockReset();
    update.mockReset();
    remove.mockReset();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [
        {
          provide: WorkflowService,
          useValue: { create, findAll, findOne, update, remove },
        },
      ],
    }).compile();
    controller = moduleRef.get(WorkflowController);
  });

  describe('POST /workflows', () => {
    it('delegates to the service on valid body', async () => {
      create.mockResolvedValueOnce({ ...validDefinition, definition: validDefinition });
      const result = await controller.create(validDefinition);
      expect(create).toHaveBeenCalled();
      expect(result.id).toBe('wf-1');
    });

    it('throws BadRequestException on invalid body', async () => {
      await expect(controller.create({ name: 'incomplete' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('GET /workflows', () => {
    it('parses query and returns paginated payload', async () => {
      findAll.mockResolvedValueOnce({ items: [], total: 0 });
      await controller.list({ limit: '5', offset: '2' });
      expect(findAll).toHaveBeenCalledWith({ limit: 5, offset: 2 });
    });

    it('throws BadRequestException on invalid query', async () => {
      await expect(controller.list({ limit: '500' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('GET /workflows/:id', () => {
    it('returns the workflow from the service', async () => {
      findOne.mockResolvedValueOnce({ id: 'wf-1' });
      const result = await controller.findOne('wf-1');
      expect(result.id).toBe('wf-1');
      expect(findOne).toHaveBeenCalledWith('wf-1');
    });
  });

  describe('PATCH /workflows/:id', () => {
    it('validates and delegates to the service', async () => {
      update.mockResolvedValueOnce({ id: 'wf-1', name: 'New' });
      const result = await controller.update('wf-1', { name: 'New' });
      expect(result.name).toBe('New');
      expect(update).toHaveBeenCalledWith('wf-1', { name: 'New' });
    });

    it('throws BadRequestException on empty body', async () => {
      await expect(controller.update('wf-1', {})).rejects.toBeInstanceOf(BadRequestException);
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /workflows/:id', () => {
    it('delegates to the service', async () => {
      remove.mockResolvedValueOnce(undefined);
      await controller.remove('wf-1');
      expect(remove).toHaveBeenCalledWith('wf-1');
    });
  });
});
