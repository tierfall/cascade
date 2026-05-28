import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { AuthModule } from './auth/auth.module.js';
import { CredentialModule } from './credentials/credential.module.js';
import { HealthModule } from './health/health.module.js';
import { LimitsModule } from './limits/limits.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RunModule } from './runs/run.module.js';
import { SecretModule } from './secrets/secret.module.js';
import { SetupModule } from './setup/setup.module.js';
import { StorageModule } from './storage/storage.module.js';
import { WorkflowModule } from './workflows/workflow.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    SecretModule,
    AuthModule,
    SetupModule,
    HealthModule,
    WorkflowModule,
    CredentialModule,
    StorageModule,
    LimitsModule,
    RunModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(cookieParser()).forRoutes('*');
  }
}
