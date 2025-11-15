import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RateLimitService } from './rate-limit.service';
import { CreateRateLimitDto, UpdateRateLimitDto } from './dto/rate-limit.dto';

@ApiTags('Rate Limits')
@Controller('rate-limits')
export class RateLimitController {
  constructor(private rateLimitService: RateLimitService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new rate limit configuration' })
  async createRateLimit(@Body() data: CreateRateLimitDto) {
    return this.rateLimitService.createRateLimit(data);
  }

  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get all rate limits for a tenant' })
  async getRateLimitsByTenant(@Param('tenantId') tenantId: string) {
    return this.rateLimitService.getRateLimitsByTenant(tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update rate limit configuration' })
  async updateRateLimit(@Param('id') id: string, @Body() data: UpdateRateLimitDto) {
    return this.rateLimitService.updateRateLimit(id, data);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle rate limit active status' })
  async toggleRateLimit(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.rateLimitService.toggleRateLimit(id, body.isActive);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete rate limit configuration' })
  async deleteRateLimit(@Param('id') id: string) {
    await this.rateLimitService.deleteRateLimit(id);
  }
}
