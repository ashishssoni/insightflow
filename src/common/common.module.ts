import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AiProviderService } from './ai-provider.service';
import { MongoService } from './mongo.service';
import { QueueService } from './queue.service';
import { WorkspaceRoleGuard } from './workspace-role.guard';

@Global()
@Module({
  imports: [JwtModule.register({})],
  providers: [AiProviderService, MongoService, QueueService, WorkspaceRoleGuard],
  exports: [AiProviderService, MongoService, QueueService, WorkspaceRoleGuard, JwtModule],
})
export class CommonModule {}
