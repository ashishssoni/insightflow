import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { UsageMetric } from '@prisma/client';
import { ObjectId } from 'mongodb';
import { AiProviderService } from '../../common/ai-provider.service';
import { MongoService } from '../../common/mongo.service';
import { PrismaService } from '../../common/prisma.service';
import { QueueService } from '../../common/queue.service';
import { CreateAiJobDto } from './dto/create-ai-job.dto';

type StoredDocument = {
  _id?: ObjectId;
  workspaceId: string;
  title: string;
  kind: 'NOTE' | 'PDF' | 'TICKET' | 'CONTRACT' | 'TRANSCRIPT';
  content: string;
  summary?: string;
};

type StoredWorkflowRun = {
  _id?: ObjectId;
  workspaceId: string;
  documentId: string;
  requestedById: string;
  type: 'SUMMARIZE' | 'CLASSIFY' | 'EXTRACT';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  provider?: string;
  model?: string;
  tokenEstimate: number;
  outputRef?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ExecutionLog = {
  workflowRunId: string;
  workspaceId: string;
  level: string;
  message: string;
  createdAt: Date;
};

type AiOutput = {
  workflowRunId: string;
  workspaceId: string;
  documentId: string;
  type: string;
  provider: string;
  model: string;
  output: Record<string, unknown>;
  createdAt: Date;
};

@Injectable()
export class AiJobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mongo: MongoService,
    private readonly aiProvider: AiProviderService,
    private readonly queueService: QueueService,
  ) {}

  async create(userId: string, payload: CreateAiJobDto) {
    await this.assertMembership(userId, payload.workspaceId);

    const document = await this.mongo.collection<StoredDocument>('documents').findOne({
      _id: this.objectId(payload.documentId),
      workspaceId: payload.workspaceId,
    });
    if (!document) throw new NotFoundException('Document not found');

    const createdAt = new Date();
    const workflowRun: StoredWorkflowRun = {
      workspaceId: payload.workspaceId,
      documentId: payload.documentId,
      requestedById: userId,
      type: payload.type,
      status: 'QUEUED',
      tokenEstimate: 0,
      createdAt,
      updatedAt: createdAt,
    };

    const inserted = await this.mongo.collection<StoredWorkflowRun>('workflow_runs').insertOne(workflowRun);
    await this.mongo.collection<ExecutionLog>('execution_logs').insertOne({
      workflowRunId: inserted.insertedId.toString(),
      workspaceId: payload.workspaceId,
      level: 'info',
      message: 'Workflow queued for processing',
      createdAt,
    });

    const providerResult = await this.aiProvider.process({
      title: document.title,
      content: document.content,
      kind: document.kind,
      jobType: payload.type,
    });

    const aiOutput = await this.mongo.collection<AiOutput>('ai_outputs').insertOne({
      workflowRunId: inserted.insertedId.toString(),
      workspaceId: payload.workspaceId,
      documentId: payload.documentId,
      type: payload.type,
      provider: providerResult.provider,
      model: providerResult.model,
      output: providerResult.output,
      createdAt: new Date(),
    });

    await this.mongo.collection<StoredWorkflowRun>('workflow_runs').updateOne(
      { _id: inserted.insertedId },
      {
        $set: {
          status: 'COMPLETED',
          provider: providerResult.provider,
          model: providerResult.model,
          tokenEstimate: providerResult.tokenEstimate,
          outputRef: aiOutput.insertedId.toString(),
          updatedAt: new Date(),
        },
      },
    );

    if (payload.type === 'SUMMARIZE') {
      await this.mongo.collection<StoredDocument>('documents').updateOne(
        { _id: document._id },
        { $set: { summary: providerResult.output.summary, updatedAt: new Date() } },
      );
    }

    await this.prisma.usageEvent.createMany({
      data: [
        {
          workspaceId: payload.workspaceId,
          metric: UsageMetric.WORKFLOW_RUNS,
          quantity: 1,
          metadata: { workflowRunId: inserted.insertedId.toString(), type: payload.type },
        },
        {
          workspaceId: payload.workspaceId,
          metric: UsageMetric.TOKENS,
          quantity: providerResult.tokenEstimate,
          metadata: { workflowRunId: inserted.insertedId.toString(), model: providerResult.model },
        },
      ],
    });

    const queuedJob = await this.queueService.enqueueDocumentJob('workflow-run', {
      workflowRunId: inserted.insertedId.toString(),
      workspaceId: payload.workspaceId,
      type: payload.type,
    });

    return {
      message: 'AI workflow completed in mock mode',
      workflowRunId: inserted.insertedId.toString(),
      queue: queuedJob,
      outputId: aiOutput.insertedId.toString(),
      tokenEstimate: providerResult.tokenEstimate,
      result: providerResult.output,
    };
  }

  async list(userId: string, workspaceId: string) {
    await this.assertMembership(userId, workspaceId);
    const jobs = await this.mongo.collection<StoredWorkflowRun>('workflow_runs').find({ workspaceId }).sort({ createdAt: -1 }).toArray();
    return jobs.map((job) => ({ ...job, _id: job._id?.toString() }));
  }

  private async assertMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.membership.findFirst({ where: { userId, workspaceId } });
    if (!membership) throw new ForbiddenException('You do not belong to this workspace');
    return membership;
  }

  private objectId(value: string) {
    try {
      return new ObjectId(value);
    } catch {
      throw new NotFoundException('Invalid identifier');
    }
  }
}
