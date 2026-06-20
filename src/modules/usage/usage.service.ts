import { ForbiddenException, Injectable } from '@nestjs/common';
import { UsageMetric, WorkspacePlan } from '@prisma/client';
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

    const [events, groupedTotals] = await Promise.all([
      this.prisma.usageEvent.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.usageEvent.groupBy({
        by: ['metric'],
        where: { workspaceId },
        _sum: { quantity: true },
      }),
    ]);

    const totals = {
      tokens: 0,
      documents: 0,
      workflowRuns: 0,
    };

    for (const item of groupedTotals) {
      const quantity = item._sum.quantity ?? 0;
      if (item.metric === UsageMetric.TOKENS) totals.tokens = quantity;
      if (item.metric === UsageMetric.DOCUMENTS) totals.documents = quantity;
      if (item.metric === UsageMetric.WORKFLOW_RUNS) totals.workflowRuns = quantity;
    }

    const softLimitsByPlan: Record<WorkspacePlan, typeof totals> = {
      FREE: { tokens: 10000, documents: 100, workflowRuns: 25 },
      PRO: { tokens: 50000, documents: 500, workflowRuns: 200 },
      SCALE: { tokens: 250000, documents: 5000, workflowRuns: 1500 },
    };

    const softLimits = softLimitsByPlan[membership.workspace.plan];

    return {
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        plan: membership.workspace.plan,
      },
      totals,
      recentEvents: events,
      softLimits,
      remaining: {
        tokens: Math.max(softLimits.tokens - totals.tokens, 0),
        documents: Math.max(softLimits.documents - totals.documents, 0),
        workflowRuns: Math.max(softLimits.workflowRuns - totals.workflowRuns, 0),
      },
    };
  }
}
