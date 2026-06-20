import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './common/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { AiJobsModule } from './modules/ai-jobs/ai-jobs.module';
import { UsageModule } from './modules/usage/usage.module';

@Module({
  imports: [
    CommonModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    WorkspacesModule,
    DocumentsModule,
    AiJobsModule,
    UsageModule,
  ],
})
export class AppModule {}
