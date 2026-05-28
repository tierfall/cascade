import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseFilters,
} from '@nestjs/common';
import { z } from 'zod';
import { CreateWorkflowBodySchema, ListQuerySchema, UpdateWorkflowBodySchema } from './dto.js';
import { WorkflowExceptionFilter } from './workflow.exception-filter.js';
import { WorkflowService, type WorkflowDetail, type WorkflowSummary } from './workflow.service.js';

function throwValidation(error: z.ZodError): never {
  throw new BadRequestException({
    error: 'VALIDATION',
    issues: error.issues.map((i) => ({ path: i.path, message: i.message, code: i.code })),
  });
}

@Controller('workflows')
@UseFilters(WorkflowExceptionFilter)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown): Promise<WorkflowDetail> {
    const parsed = CreateWorkflowBodySchema.safeParse(body);
    if (!parsed.success) throwValidation(parsed.error);
    return this.workflowService.create(parsed.data);
  }

  @Get()
  async list(
    @Query() rawQuery: Record<string, unknown>,
  ): Promise<{ items: WorkflowSummary[]; total: number }> {
    const parsed = ListQuerySchema.safeParse(rawQuery);
    if (!parsed.success) throwValidation(parsed.error);
    return this.workflowService.findAll(parsed.data);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<WorkflowDetail> {
    return this.workflowService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: unknown): Promise<WorkflowDetail> {
    const parsed = UpdateWorkflowBodySchema.safeParse(body);
    if (!parsed.success) throwValidation(parsed.error);
    return this.workflowService.update(id, parsed.data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Promise<void> {
    return this.workflowService.remove(id);
  }
}
