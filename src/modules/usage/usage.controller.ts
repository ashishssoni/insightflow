import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { UsageService } from './usage.service';

@ApiTags('Usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usage')
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Get(':workspaceId/overview')
  @ApiOperation({ summary: 'Get usage metrics and limits for a workspace' })
  overview(@CurrentUser() user: { sub: string }, @Param('workspaceId') workspaceId: string) {
    return this.usageService.overview(user.sub, workspaceId);
  }
}
