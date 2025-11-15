import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async createTenant(data: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        rateLimits: true,
      },
    });
  }

  async getAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        rateLimits: true,
        _count: {
          select: { requestLogs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTenantById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        rateLimits: {
          where: { isActive: true },
        },
        _count: {
          select: { requestLogs: true },
        },
      },
    });
  }

  async getTenantByApiKey(apiKey: string) {
    return this.prisma.tenant.findUnique({
      where: { apiKey },
      include: {
        rateLimits: {
          where: { isActive: true },
        },
      },
    });
  }

  async updateTenant(id: string, data: UpdateTenantDto) {
    return this.prisma.tenant.update({
      where: { id },
      data,
      include: {
        rateLimits: true,
      },
    });
  }

  async deleteTenant(id: string) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }

  async getTenantStats(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        rateLimits: true,
        requestLogs: {
          take: 100,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!tenant) return null;

    const totalRequests = await this.prisma.requestLog.count({
      where: { tenantId: id },
    });

    const allowedRequests = await this.prisma.requestLog.count({
      where: { tenantId: id, isAllowed: true },
    });

    const blockedRequests = totalRequests - allowedRequests;

    return {
      tenant,
      stats: {
        totalRequests,
        allowedRequests,
        blockedRequests,
        blockRate: totalRequests > 0 ? parseFloat(((blockedRequests / totalRequests) * 100).toFixed(2)) : 0,
      },
    };
  }
}
