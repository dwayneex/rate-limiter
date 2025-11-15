import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckRateLimitDto {
  @ApiProperty({ 
    example: 'your-api-key-here',
    description: 'Tenant API Key'
  })
  @IsString()
  tenantId: string;

  @ApiProperty({ 
    example: '/api/users',
    description: 'API route being accessed',
    required: false
  })
  @IsString()
  @IsOptional()
  apiRoute?: string;

  @ApiProperty({ 
    example: '192.168.1.1',
    description: 'IP address of the requester',
    required: false
  })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({ 
    example: 'user-123',
    description: 'User ID making the request',
    required: false
  })
  @IsString()
  @IsOptional()
  userId?: string;
}
