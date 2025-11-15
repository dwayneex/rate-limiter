import { IsString, IsInt, IsEnum, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RateLimitType } from '@prisma/client';

export class CreateRateLimitDto {
  @ApiProperty({ example: 'uuid' })
  @IsString()
  tenantId: string;

  @ApiProperty({ 
    enum: RateLimitType,
    example: 'GLOBAL',
    description: 'GLOBAL (tenant-wide), IP_ADDRESS (per IP), API_ROUTE (per endpoint), USER_ID (per user)'
  })
  @IsEnum(RateLimitType)
  type: RateLimitType;

  @ApiProperty({ 
    example: '/api/users',
    required: false,
    description: 'API route for API_ROUTE type, null for others'
  })
  @IsString()
  @IsOptional()
  identifier?: string;

  @ApiProperty({ example: 100, description: 'Maximum requests allowed' })
  @IsInt()
  @Min(1)
  maxRequests: number;

  @ApiProperty({ example: 60000, description: 'Time window in milliseconds (60000 = 1 minute)' })
  @IsInt()
  @Min(1000)
  windowMs: number;
}

export class UpdateRateLimitDto {
  @ApiProperty({ required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxRequests?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(1000)
  @IsOptional()
  windowMs?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  identifier?: string;
}
