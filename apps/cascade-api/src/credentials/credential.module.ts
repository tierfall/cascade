import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CredentialService } from './credential.service.js';

@Module({
  imports: [PrismaModule],
  providers: [CredentialService],
  exports: [CredentialService],
})
export class CredentialModule {}
