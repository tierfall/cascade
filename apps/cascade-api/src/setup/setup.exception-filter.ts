import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { AlreadyInitializedError, ConcurrentSetupError } from './setup.errors.js';

@Catch(AlreadyInitializedError, ConcurrentSetupError)
export class SetupExceptionFilter
  implements ExceptionFilter<AlreadyInitializedError | ConcurrentSetupError>
{
  catch(exception: AlreadyInitializedError | ConcurrentSetupError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    if (exception instanceof AlreadyInitializedError) {
      res.status(HttpStatus.GONE).json({ error: 'ALREADY_INITIALIZED' });
      return;
    }
    res.status(HttpStatus.CONFLICT).json({ error: 'CONCURRENT_SETUP' });
  }
}
