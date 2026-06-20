import { Module } from '@nestjs/common';
import { AiJobsController } from './ai-jobs.controller';
import { AiJobsProcessor } from './ai-jobs.processor';
import { AiJobsService } from './ai-jobs.service';

@Module({ controllers: [AiJobsController], providers: [AiJobsService, AiJobsProcessor] })
export class AiJobsModule {}
