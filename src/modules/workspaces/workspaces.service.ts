import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoService } from '../../common/mongo.service';
import { PrismaService } from '../../common/prisma.service';

type StoredDocument = { _id?: ObjectId; workspaceId: string; title: string; kind: string; createdAt: Date };

type StoredWorkflowRun = { workspaceId: string; createdAt: Date };

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mongo: MongoService,
  ) {}

  async listForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { workspace: { createdAt: 'desc' } },
    });

    return Promise.all(
      memberships.map(async (membership) => ({
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        role: membership.role,
        plan: membership.workspace.plan,
        documentsCount: await this.mongo.collection<StoredDocument>('documents').countDocuments({ workspaceId: membership.workspace.id }),
        jobsCount: await this.mongo.collection<StoredWorkflowRun>('workflow_runs').countDocuments({ workspaceId: membership.workspace.id }),
      })),
    );
  }

  async getBySlug(userId: string, slug: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, workspace: { slug } },
      include: {
        workspace: {
          include: {
            memberships: {
              include: { user: { select: { id: true, fullName: true, email: true } } },
            },
          },
        },
      },
    });

    if (!membership) {
      const exists = await this.prisma.workspace.findUnique({ where: { slug } });
      if (exists) throw new ForbiddenException('You do not have access to this workspace');
      throw new NotFoundException('Workspace not found');
    }

    const recentDocuments = await this.mongo
      .collection<StoredDocument>('documents')
      .find({ workspaceId: membership.workspace.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    return {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
      plan: membership.workspace.plan,
      members: membership.workspace.memberships.map((item) => ({
        id: item.user.id,
        fullName: item.user.fullName,
        email: item.user.email,
        role: item.role,
      })),
      recentDocuments: recentDocuments.map((document) => ({
        id: document._id?.toString(),
        title: document.title,
        kind: document.kind,
        createdAt: document.createdAt,
      })),
    };
  }
}
