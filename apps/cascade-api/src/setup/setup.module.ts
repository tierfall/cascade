import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SetupController } from './setup.controller.js';
import { SetupService } from './setup.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [SetupController],
  providers: [SetupService],
})
export class SetupModule {}
