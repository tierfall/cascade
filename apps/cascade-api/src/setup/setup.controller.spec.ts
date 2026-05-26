import { jest } from '@jest/globals';
import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { SetupController } from './setup.controller.js';
import { AlreadyInitializedError } from './setup.errors.js';
import { SetupService } from './setup.service.js';

function buildRes(): { res: Response; statusFn: jest.Mock; jsonFn: jest.Mock } {
  const jsonFn = jest.fn();
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn });
  const res = { status: statusFn, json: jsonFn } as unknown as Response;
  return { res, statusFn, jsonFn };
}

describe('SetupController', () => {
  const status = jest.fn<() => Promise<{ needsSetup: boolean }>>();
  const initialize =
    jest.fn<
      (body: { email: string; password: string }) => Promise<{ id: string; email: string }>
    >();
  let controller: SetupController;

  beforeEach(async () => {
    status.mockReset();
    initialize.mockReset();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [SetupController],
      providers: [{ provide: SetupService, useValue: { status, initialize } }],
    }).compile();
    controller = moduleRef.get(SetupController);
  });

  describe('GET /setup', () => {
    it('returns the form schema when needsSetup is true', async () => {
      status.mockResolvedValueOnce({ needsSetup: true });
      const { res, statusFn, jsonFn } = buildRes();
      await controller.get(res);
      expect(statusFn).toHaveBeenCalledWith(HttpStatus.OK);
      expect(jsonFn).toHaveBeenCalledWith({
        needsSetup: true,
        fields: [
          { name: 'email', type: 'email' },
          { name: 'password', type: 'password', minLength: 12 },
        ],
      });
    });

    it('returns 410 when setup is already complete', async () => {
      status.mockResolvedValueOnce({ needsSetup: false });
      const { res, statusFn, jsonFn } = buildRes();
      await controller.get(res);
      expect(statusFn).toHaveBeenCalledWith(HttpStatus.GONE);
      expect(jsonFn).toHaveBeenCalledWith({ needsSetup: false });
    });
  });

  describe('POST /setup', () => {
    it('returns 201 with id+email on success', async () => {
      initialize.mockResolvedValueOnce({ id: 'u1', email: 'admin@example.com' });
      const out = await controller.post({
        email: 'admin@example.com',
        password: 'correct-horse-1',
      });
      expect(out).toEqual({ id: 'u1', email: 'admin@example.com' });
    });

    it('throws BadRequestException on validation failure', async () => {
      await expect(controller.post({ email: 'nope', password: 'short' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(initialize).not.toHaveBeenCalled();
    });

    it('propagates AlreadyInitializedError for the filter to handle', async () => {
      initialize.mockRejectedValueOnce(new AlreadyInitializedError());
      await expect(
        controller.post({ email: 'admin@example.com', password: 'correct-horse-1' }),
      ).rejects.toBeInstanceOf(AlreadyInitializedError);
    });
  });
});
