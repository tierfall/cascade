import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import 'reflect-metadata';
import { AppModule } from './app.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());

  const config = new DocumentBuilder()
    .setTitle('Cascade API')
    .setDescription(
      'HTTP API for Cascade — self-hosted visual AI workflow editor. ' +
        'All endpoints except /health and /setup require a session cookie issued by /auth/login.',
    )
    .setVersion('0.1.0')
    .setLicense('See LICENSE in repo root', 'https://github.com/tierfall/cascade/blob/main/LICENSE')
    .addCookieAuth('cascade_session')
    .addTag('auth', 'Login / logout / current user')
    .addTag('setup', 'First-boot setup wizard')
    .addTag('workflows', 'Workflow CRUD')
    .addTag('health', 'Health checks')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // GET /api/openapi.json returns the spec; GET /api serves Swagger UI.
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api/openapi.json',
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? '3000');
  await app.listen(port);
  const { Logger } = await import('@nestjs/common');
  Logger.log(`cascade-api listening on :${port.toString()}`, 'Bootstrap');
}

void bootstrap();
