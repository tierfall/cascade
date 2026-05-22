import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  const port = Number(process.env.PORT ?? '3000');
  await app.listen(port);
  const { Logger } = await import('@nestjs/common');
  Logger.log(`cascade-api listening on :${port.toString()}`, 'Bootstrap');
}

void bootstrap();
