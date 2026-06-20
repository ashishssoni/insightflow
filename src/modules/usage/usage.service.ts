import { ForbiddenException, Injectable } from '@nestjs/common';
import { UsageMetric } from '@prisma/client';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: string, workspaceId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, workspaceId },
      include: { workspace: true },
    });

    if (!membership) throw new ForbiddenException('You do not belong to this workspace');

    const events = await this.prisma.usageEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totals = {
      tokens: 0,
      documents: 0,
      workflowRuns: 0,
    };

    for (const event of events) {
      if (event.metric === UsageMetric.TOKENS) totals.tokens += event.quantity;
      if (event.metric === UsageMetric.DOCUMENTS) totals.documents += event.quantity;
      if (event.metric === UsageMetric.WORKFLOW_RUNS) totals.workflowRuns += event.quantity;
    }

    return {
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        plan: membership.workspace.plan,
      },
      totals,
      recentEvents: events,
      softLimits: {
        tokens: membership.workspace.plan === 'SCALE' ? 250000 : 50000,
        documents: membership.workspace.plan === 'SCALE' ? 5000 : 500,
        workflowRuns: membership.workspace.plan === 'SCALE' ? 1500 : 200,
      },
    };
  }
}
