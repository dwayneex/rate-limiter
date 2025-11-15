import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    });

    this.client.on('error', (err) => console.error('Redis Client Error', err));
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  getClient(): RedisClientType {
    return this.client;
  }

  // Sliding window counter implementation
  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number,
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries outside the window
    await this.client.zRemRangeByScore(key, 0, windowStart);

    // Count requests in current window
    const requestCount = await this.client.zCard(key);

    if (requestCount < maxRequests) {
      // Add current request
      await this.client.zAdd(key, { score: now, value: `${now}` });
      await this.client.expire(key, Math.ceil(windowMs / 1000));

      return {
        allowed: true,
        remaining: maxRequests - requestCount - 1,
        resetAt: new Date(now + windowMs),
      };
    }

    // Get the oldest request in the window to calculate reset time
    const oldestRequest = await this.client.zRange(key, 0, 0);
    const resetAt = oldestRequest.length > 0 
      ? new Date(parseInt(oldestRequest[0]) + windowMs)
      : new Date(now + windowMs);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  // Cache tenant rate limits to reduce DB calls
  async cacheTenantRateLimits(tenantId: string, rateLimits: any[], ttlSeconds = 300) {
    const key = `tenant:${tenantId}:limits`;
    await this.client.setEx(key, ttlSeconds, JSON.stringify(rateLimits));
  }

  async getCachedTenantRateLimits(tenantId: string): Promise<any[] | null> {
    const key = `tenant:${tenantId}:limits`;
    const cached = await this.client.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async invalidateTenantCache(tenantId: string) {
    const key = `tenant:${tenantId}:limits`;
    await this.client.del(key);
  }
}
