import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { WorkflowNotFoundError } from '../workflows/workflow.errors.js';
import { RunNotFoundError } from './run.errors.js';

@Catch(RunNotFoundError, WorkflowNotFoundError)
export class RunExceptionFilter
  implements ExceptionFilter<RunNotFoundError | WorkflowNotFoundError>
{
  catch(exception: RunNotFoundError | WorkflowNotFoundError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof RunNotFoundError) {
      res.status(HttpStatus.NOT_FOUND).json({ error: 'RUN_NOT_FOUND', id: exception.id });
      return;
    }
    res.status(HttpStatus.NOT_FOUND).json({ error: 'WORKFLOW_NOT_FOUND', id: exception.id });
  }
}
