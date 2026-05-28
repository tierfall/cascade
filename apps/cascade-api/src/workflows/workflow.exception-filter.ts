import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { WorkflowAlreadyExistsError, WorkflowNotFoundError } from './workflow.errors.js';

@Catch(WorkflowNotFoundError, WorkflowAlreadyExistsError)
export class WorkflowExceptionFilter
  implements ExceptionFilter<WorkflowNotFoundError | WorkflowAlreadyExistsError>
{
  catch(exception: WorkflowNotFoundError | WorkflowAlreadyExistsError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof WorkflowNotFoundError) {
      res.status(HttpStatus.NOT_FOUND).json({ error: 'WORKFLOW_NOT_FOUND', id: exception.id });
      return;
    }
    res.status(HttpStatus.CONFLICT).json({ error: 'WORKFLOW_ALREADY_EXISTS', id: exception.id });
  }
}
