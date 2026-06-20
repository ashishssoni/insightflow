import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Core')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  getHealth() {
    return { status: 'ok', service: 'insightflow-api', timestamp: new Date().toISOString() };
  }
}
