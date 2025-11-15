import { Module } from '@nestjs/common';
import { RateLimiterController } from './rate-limiter.controller';
import { RateLimiterService } from './rate-limiter.service';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [RateLimitModule, TenantModule],
  controllers: [RateLimiterController],
  providers: [RateLimiterService],
})
export class RateLimiterModule {}
