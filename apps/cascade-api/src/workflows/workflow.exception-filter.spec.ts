import { jest } from '@jest/globals';
import type { ArgumentsHost } from '@nestjs/common';
import { WorkflowAlreadyExistsError, WorkflowNotFoundError } from './workflow.errors.js';
import { WorkflowExceptionFilter } from './workflow.exception-filter.js';

function buildHost(): {
  host: ArgumentsHost;
  status: jest.Mock;
  json: jest.Mock;
} {
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

describe('WorkflowExceptionFilter', () => {
  it('maps WorkflowNotFoundError to 404', () => {
    const filter = new WorkflowExceptionFilter();
    const { host, status, json } = buildHost();
    filter.catch(new WorkflowNotFoundError('wf-1'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'WORKFLOW_NOT_FOUND', id: 'wf-1' });
  });

  it('maps WorkflowAlreadyExistsError to 409', () => {
    const filter = new WorkflowExceptionFilter();
    const { host, status, json } = buildHost();
    filter.catch(new WorkflowAlreadyExistsError('wf-1'), host);
    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({ error: 'WORKFLOW_ALREADY_EXISTS', id: 'wf-1' });
  });
});
