import {
  type ArgumentsHost,
  Body,
  Catch,
  Controller,
  type ExceptionFilter,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseFilters,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../auth/public.decorator.js';
import { WebhookNotFoundError } from './webhook.errors.js';
import { WebhookService } from './webhook.service.js';

@Catch(WebhookNotFoundError)
class WebhookNotFoundFilter implements ExceptionFilter<WebhookNotFoundError> {
  catch(exception: WebhookNotFoundError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(HttpStatus.NOT_FOUND).json({ error: 'WEBHOOK_NOT_FOUND', path: exception.path });
  }
}

@Controller('webhooks')
@Public()
@UseFilters(WebhookNotFoundFilter)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  // Wildcard route. Nest's `*` matches the rest of the URL but Express's
  // route param binding for wildcards isn't exposed via @Param in a stable
  // way across versions, so we read req.path and strip the /webhooks prefix.
  @Post('*')
  @HttpCode(HttpStatus.ACCEPTED)
  async trigger(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<{ runId: string; workflowId: string }> {
    const stripped = req.path.replace(/^\/webhooks/, '');
    const path = stripped.length === 0 ? '/' : stripped;
    return this.webhookService.trigger(path, body);
  }
}
