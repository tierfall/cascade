import { Global, Module } from '@nestjs/common';
import { RunLimitsService } from './run-limits.js';

@Global()
@Module({
  providers: [RunLimitsService],
  exports: [RunLimitsService],
})
export class LimitsModule {}
