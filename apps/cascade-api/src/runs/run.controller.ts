import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { z } from 'zod';
import { ListRunsQuerySchema, TriggerRunBodySchema } from './dto.js';
import { RunExceptionFilter } from './run.exception-filter.js';
import { type RunDetail, RunService, type RunSummary } from './run.service.js';

function throwValidation(error: z.ZodError): never {
  throw new BadRequestException({
    error: 'VALIDATION',
    issues: error.issues.map((i) => ({ path: i.path, message: i.message, code: i.code })),
  });
}

@Controller()
@UseFilters(RunExceptionFilter)
export class RunController {
  constructor(private readonly runService: RunService) {}

  @Post('workflows/:id/runs')
  @HttpCode(HttpStatus.CREATED)
  async trigger(@Param('id') workflowId: string, @Body() body: unknown): Promise<RunDetail> {
    const parsed = TriggerRunBodySchema.safeParse(body);
    if (!parsed.success) throwValidation(parsed.error);
    return this.runService.triggerSync(workflowId, parsed.data.input);
  }

  @Get('runs/:id')
  findOne(@Param('id') id: string): Promise<RunDetail> {
    return this.runService.findOne(id);
  }

  @Get('runs')
  async list(
    @Query() rawQuery: Record<string, unknown>,
  ): Promise<{ items: RunSummary[]; total: number }> {
    const parsed = ListRunsQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throwValidation(parsed.error);
    return this.runService.findAll({
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      ...(parsed.data.workflowId !== undefined ? { workflowId: parsed.data.workflowId } : {}),
    });
  }
}
