import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RunModule } from '../runs/run.module.js';
import { WebhookController } from './webhook.controller.js';
import { WebhookService } from './webhook.service.js';

@Module({
  imports: [PrismaModule, RunModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
