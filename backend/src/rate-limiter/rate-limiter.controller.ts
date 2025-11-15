import { Controller, Post, Get, Body, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RateLimiterService } from './rate-limiter.service';
import { CheckRateLimitDto } from './dto/rate-limiter.dto';

@ApiTags('Rate Limiter')
@Controller()
export class RateLimiterController {
  constructor(private rateLimiterService: RateLimiterService) {}

  @Post('/')
  @HttpCode(200)
  @ApiOperation({ 
    summary: 'Check if request is allowed by rate limiter',
    description: 'Main endpoint to check rate limits. Returns 200 if allowed, 429 if rate limited.'
  })
  @ApiResponse({ status: 200, description: 'Request allowed' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async checkRateLimit(@Body() data: CheckRateLimitDto) {
    const result = await this.rateLimiterService.checkRateLimit(data);
    
    if (!result.allowed) {
      return {
        statusCode: 429,
        message: 'Too Many Requests',
        ...result,
      };
    }

    return {
      statusCode: 200,
      message: 'Request allowed',
      ...result,
    };
  }

  @Get('/logs/:tenantId')
  @ApiOperation({ summary: 'Get recent request logs for a tenant' })
  async getRecentLogs(
    @Query('tenantId') tenantId: string,
    @Query('limit') limit?: string,
  ) {
    return this.rateLimiterService.getRecentLogs(tenantId, limit ? parseInt(limit) : 50);
  }

  @Get('/stats/:tenantId')
  @ApiOperation({ summary: 'Get statistics for a tenant' })
  async getLogStats(
    @Query('tenantId') tenantId: string,
    @Query('fromDate') fromDate?: string,
  ) {
    const from = fromDate ? new Date(fromDate) : undefined;
    return this.rateLimiterService.getLogStats(tenantId, from);
  }
}
