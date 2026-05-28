import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseFilters,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator.js';
import { SetupBodySchema, type SetupBody } from './dto.js';
import { SetupExceptionFilter } from './setup.exception-filter.js';
import { SetupService } from './setup.service.js';

@Controller('setup')
@Public()
@UseFilters(SetupExceptionFilter)
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Get()
  async get(@Res({ passthrough: false }) res: Response): Promise<void> {
    const { needsSetup } = await this.setupService.status();
    if (!needsSetup) {
      res.status(HttpStatus.GONE).json({ needsSetup: false });
      return;
    }
    res.status(HttpStatus.OK).json({
      needsSetup: true,
      fields: [
        { name: 'email', type: 'email' },
        { name: 'password', type: 'password', minLength: 12 },
      ],
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async post(@Body() body: unknown): Promise<{ id: string; email: string }> {
    const parsed = SetupBodySchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'VALIDATION',
        issues: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
          code: i.code,
        })),
      });
    }
    const validated: SetupBody = parsed.data;
    return this.setupService.initialize(validated);
  }
}
