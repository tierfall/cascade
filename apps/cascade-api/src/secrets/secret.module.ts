import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SecretService } from './secret.service.js';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [SecretService],
  exports: [SecretService],
})
export class SecretModule {}
