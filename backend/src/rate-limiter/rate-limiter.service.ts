import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { TenantService } from '../tenant/tenant.service';
import { CheckRateLimitDto } from './dto/rate-limiter.dto';
import { RateLimitType } from '@prisma/client';

@Injectable()
export class RateLimiterService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private rateLimitService: RateLimitService,
    private tenantService: TenantService,
  ) {}

  async checkRateLimit(data: CheckRateLimitDto) {
    // Validate tenant
    const tenant = await this.tenantService.getTenantByApiKey(data.tenantId);
    if (!tenant || !tenant.isActive) {
      return {
        allowed: false,
        error: 'Invalid or inactive tenant',
      };
    }

    // Get active rate limits for tenant (cached)
    const rateLimits = await this.rateLimitService.getActiveLimitsForTenant(tenant.id);

    if (rateLimits.length === 0) {
      // No rate limits configured, allow by default
      await this.logRequest(tenant.id, data, true);
      return {
        allowed: true,
        message: 'No rate limits configured',
      };
    }

    // Check each applicable rate limit
    const results = [];
    
    for (const limit of rateLimits) {
      let key: string;
      let shouldCheck = false;

      switch (limit.type) {
        case RateLimitType.GLOBAL:
          key = `ratelimit:${tenant.id}:global`;
          shouldCheck = true;
          break;

        case RateLimitType.IP_ADDRESS:
          if (data.ipAddress) {
            key = `ratelimit:${tenant.id}:ip:${data.ipAddress}`;
            shouldCheck = true;
          }
          break;

        case RateLimitType.API_ROUTE:
          if (data.apiRoute && limit.identifier === data.apiRoute) {
            key = `ratelimit:${tenant.id}:api:${data.apiRoute}`;
            shouldCheck = true;
          }
          break;

        case RateLimitType.USER_ID:
          if (data.userId) {
            key = `ratelimit:${tenant.id}:user:${data.userId}`;
            shouldCheck = true;
          }
          break;
      }

      if (shouldCheck) {
        const result = await this.redis.checkRateLimit(
          key,
          limit.maxRequests,
          limit.windowMs,
        );

        results.push({
          type: limit.type,
          identifier: limit.identifier,
          ...result,
        });

        // If any limit is exceeded, deny the request
        if (!result.allowed) {
          await this.logRequest(tenant.id, data, false);
          return {
            allowed: false,
            reason: `Rate limit exceeded for ${limit.type}`,
            limits: results,
          };
        }
      }
    }

    // All checks passed
    await this.logRequest(tenant.id, data, true);
    
    return {
      allowed: true,
      limits: results,
    };
  }

  private async logRequest(tenantId: string, data: CheckRateLimitDto, isAllowed: boolean) {
    try {
      await this.prisma.requestLog.create({
        data: {
          tenantId,
          apiRoute: data.apiRoute,
          ipAddress: data.ipAddress,
          userId: data.userId,
          isAllowed,
        },
      });
    } catch (error) {
      console.error('Failed to log request:', error);
      // Don't fail the request if logging fails
    }
  }

  async getRecentLogs(tenantId: string, limit = 50) {
    return this.prisma.requestLog.findMany({
      where: { tenantId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getLogStats(tenantId: string, fromDate?: Date) {
    const where = {
      tenantId,
      ...(fromDate && { timestamp: { gte: fromDate } }),
    };

    const [total, allowed, blocked] = await Promise.all([
      this.prisma.requestLog.count({ where }),
      this.prisma.requestLog.count({ where: { ...where, isAllowed: true } }),
      this.prisma.requestLog.count({ where: { ...where, isAllowed: false } }),
    ]);

    return {
      total,
      allowed,
      blocked,
      blockRate: total > 0 ? ((blocked / total) * 100).toFixed(2) : '0.00',
    };
  }
}
