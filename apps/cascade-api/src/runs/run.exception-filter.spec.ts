import { jest } from '@jest/globals';
import type { ArgumentsHost } from '@nestjs/common';
import { WorkflowNotFoundError } from '../workflows/workflow.errors.js';
import { RunNotFoundError } from './run.errors.js';
import { RunExceptionFilter } from './run.exception-filter.js';

function buildHost(): { host: ArgumentsHost; status: jest.Mock; json: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return {
    json,
    status,
    host: {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
        getRequest: () => ({}),
        getNext: () => ({}),
      }),
    } as unknown as ArgumentsHost,
  };
}

describe('RunExceptionFilter', () => {
  it('maps RunNotFoundError to 404 RUN_NOT_FOUND', () => {
    const filter = new RunExceptionFilter();
    const { host, status, json } = buildHost();
    filter.catch(new RunNotFoundError('r_1'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'RUN_NOT_FOUND', id: 'r_1' });
  });

  it('maps WorkflowNotFoundError to 404 WORKFLOW_NOT_FOUND', () => {
    const filter = new RunExceptionFilter();
    const { host, status, json } = buildHost();
    filter.catch(new WorkflowNotFoundError('wf_x'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'WORKFLOW_NOT_FOUND', id: 'wf_x' });
  });
});
