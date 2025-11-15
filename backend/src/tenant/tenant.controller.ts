import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  async createTenant(@Body() data: CreateTenantDto) {
    return this.tenantService.createTenant(data);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  async getAllTenants() {
    return this.tenantService.getAllTenants();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async getTenantById(@Param('id') id: string) {
    return this.tenantService.getTenantById(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get tenant statistics' })
  async getTenantStats(@Param('id') id: string) {
    return this.tenantService.getTenantStats(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  async updateTenant(@Param('id') id: string, @Body() data: UpdateTenantDto) {
    return this.tenantService.updateTenant(id, data);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete tenant' })
  async deleteTenant(@Param('id') id: string) {
    await this.tenantService.deleteTenant(id);
  }
}
