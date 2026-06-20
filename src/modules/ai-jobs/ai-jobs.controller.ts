import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { AiJobsService } from './ai-jobs.service';
import { CreateAiJobDto } from './dto/create-ai-job.dto';

@ApiTags('AI Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-jobs')
export class AiJobsController {
  constructor(private readonly aiJobsService: AiJobsService) {}

  @Post()
  @ApiOperation({ summary: 'Run an AI workflow against a stored document' })
  create(@CurrentUser() user: { sub: string }, @Body() body: CreateAiJobDto) {
    return this.aiJobsService.create(user.sub, body);
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'List workflow runs for a workspace' })
  list(@CurrentUser() user: { sub: string }, @Param('workspaceId') workspaceId: string) {
    return this.aiJobsService.list(user.sub, workspaceId);
  }
}
