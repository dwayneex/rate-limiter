import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateRateLimitDto, UpdateRateLimitDto } from './dto/rate-limit.dto';
import { RateLimitType } from '@prisma/client';

@Injectable()
export class RateLimitService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async createRateLimit(data: CreateRateLimitDto) {
    const rateLimit = await this.prisma.rateLimit.create({
      data: {
        tenantId: data.tenantId,
        type: data.type,
        identifier: data.identifier,
        maxRequests: data.maxRequests,
        windowMs: data.windowMs,
      },
    });

    // Invalidate cache when rate limits change
    await this.redis.invalidateTenantCache(data.tenantId);

    return rateLimit;
  }

  async getRateLimitsByTenant(tenantId: string) {
    return this.prisma.rateLimit.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRateLimit(id: string, data: UpdateRateLimitDto) {
    const rateLimit = await this.prisma.rateLimit.update({
      where: { id },
      data,
    });

    // Invalidate cache when rate limits change
    await this.redis.invalidateTenantCache(rateLimit.tenantId);

    return rateLimit;
  }

  async deleteRateLimit(id: string) {
    const rateLimit = await this.prisma.rateLimit.findUnique({
      where: { id },
    });

    if (rateLimit) {
      await this.redis.invalidateTenantCache(rateLimit.tenantId);
    }

    return this.prisma.rateLimit.delete({
      where: { id },
    });
  }

  async getActiveLimitsForTenant(tenantId: string) {
    // Check cache first
    const cached = await this.redis.getCachedTenantRateLimits(tenantId);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const limits = await this.prisma.rateLimit.findMany({
      where: {
        tenantId,
        isActive: true,
      },
    });

    // Cache for 5 minutes
    await this.redis.cacheTenantRateLimits(tenantId, limits, 300);

    return limits;
  }

  async toggleRateLimit(id: string, isActive: boolean) {
    const rateLimit = await this.prisma.rateLimit.update({
      where: { id },
      data: { isActive },
    });

    await this.redis.invalidateTenantCache(rateLimit.tenantId);

    return rateLimit;
  }
}
