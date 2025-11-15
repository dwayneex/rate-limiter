import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { TenantModule } from './tenant/tenant.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';
import { RateLimiterModule } from './rate-limiter/rate-limiter.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    TenantModule,
    RateLimitModule,
    RateLimiterModule,
  ],
})
export class AppModule {}
