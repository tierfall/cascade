import { jest } from '@jest/globals';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { AlreadyInitializedError, ConcurrentSetupError } from './setup.errors.js';
import { SetupExceptionFilter } from './setup.exception-filter.js';

function buildHost(res: { status: jest.Mock; json: jest.Mock }): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;
}

describe('SetupExceptionFilter', () => {
  const filter = new SetupExceptionFilter();

  it('maps AlreadyInitializedError to 410 GONE', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = buildHost({ status, json });
    filter.catch(new AlreadyInitializedError(), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.GONE);
    expect(json).toHaveBeenCalledWith({ error: 'ALREADY_INITIALIZED' });
  });

  it('maps ConcurrentSetupError to 409 CONFLICT', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = buildHost({ status, json });
    filter.catch(new ConcurrentSetupError(), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith({ error: 'CONCURRENT_SETUP' });
  });
});
