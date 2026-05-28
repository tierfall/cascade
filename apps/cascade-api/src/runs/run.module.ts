import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RunController } from './run.controller.js';
import { RunService } from './run.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [RunController],
  providers: [RunService],
  exports: [RunService],
})
export class RunModule {}
