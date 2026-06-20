import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { UsageMetric } from '@prisma/client';
import { Job, Worker } from 'bullmq';
import { ObjectId } from 'mongodb';
import { AiProviderService } from '../../common/ai-provider.service';
import { MongoService } from '../../common/mongo.service';
import { PrismaService } from '../../common/prisma.service';
import { env } from '../../config/env';
import { DocumentKind, JobType } from '../../common/ai-types';

type WorkflowJobPayload = {
  workflowRunId: string;
  workspaceId: string;
  documentId: string;
  requestedById: string;
  type: JobType;
};

type StoredDocument = {
  _id?: ObjectId;
  workspaceId: string;
  title: string;
  kind: DocumentKind;
  content: string;
  summary?: string;
};

type StoredWorkflowRun = {
  _id?: ObjectId;
  workspaceId: string;
  documentId: string;
  requestedById: string;
  type: JobType;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  provider?: string;
  model?: string;
  tokenEstimate: number;
  outputRef?: string;
  errorMessage?: string;
  queueJobId?: string;
  startedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type ExecutionLog = {
  workflowRunId: string;
  workspaceId: string;
  level: string;
  message: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
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
export class AiJobsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiJobsProcessor.name);
  private worker?: Worker<WorkflowJobPayload>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mongo: MongoService,
    private readonly aiProvider: AiProviderService,
  ) {}

  onModuleInit() {
    this.worker = new Worker<WorkflowJobPayload>(
      'insightflow-ai-jobs',
      async (job) => this.process(job),
      {
        connection: { url: env.REDIS_URL },
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Workflow job ${job.id} completed`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`Workflow job ${job?.id ?? 'unknown'} failed: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  private async process(job: Job<WorkflowJobPayload>) {
    const { workflowRunId, workspaceId, documentId, type } = job.data;
    const runObjectId = this.objectId(workflowRunId);
    const documentObjectId = this.objectId(documentId);
    const now = new Date();

    await this.mongo.collection<StoredWorkflowRun>('workflow_runs').updateOne(
      { _id: runObjectId, workspaceId },
      {
        $set: {
          status: 'PROCESSING',
          startedAt: now,
          updatedAt: now,
          queueJobId: String(job.id),
        },
        $unset: {
          errorMessage: '',
          failedAt: '',
        },
      },
    );

    await this.writeLog(workflowRunId, workspaceId, 'info', 'Workflow processing started', {
      queueJobId: String(job.id),
      type,
    });

    try {
      const document = await this.mongo.collection<StoredDocument>('documents').findOne({
        _id: documentObjectId,
        workspaceId,
      });

      if (!document) {
        throw new Error('Document not found for workflow run');
      }

      const providerResult = await this.aiProvider.process({
        title: document.title,
        content: document.content,
        kind: document.kind,
        jobType: type,
      });

      const aiOutput = await this.mongo.collection<AiOutput>('ai_outputs').insertOne({
        workflowRunId,
        workspaceId,
        documentId,
        type,
        provider: providerResult.provider,
        model: providerResult.model,
        output: providerResult.output,
        createdAt: new Date(),
      });

      const completedAt = new Date();
      await this.mongo.collection<StoredWorkflowRun>('workflow_runs').updateOne(
        { _id: runObjectId },
        {
          $set: {
            status: 'COMPLETED',
            provider: providerResult.provider,
            model: providerResult.model,
            tokenEstimate: providerResult.tokenEstimate,
            outputRef: aiOutput.insertedId.toString(),
            completedAt,
            updatedAt: completedAt,
          },
          $unset: {
            failedAt: '',
            errorMessage: '',
          },
        },
      );

      if (type === 'SUMMARIZE') {
        await this.mongo.collection<StoredDocument>('documents').updateOne(
          { _id: document._id },
          { $set: { summary: providerResult.output.summary, updatedAt: completedAt } },
        );
      }

      await this.prisma.usageEvent.createMany({
        data: [
          {
            workspaceId,
            metric: UsageMetric.WORKFLOW_RUNS,
            quantity: 1,
            metadata: { workflowRunId, type },
          },
          {
            workspaceId,
            metric: UsageMetric.TOKENS,
            quantity: providerResult.tokenEstimate,
            metadata: { workflowRunId, model: providerResult.model },
          },
        ],
      });

      await this.writeLog(workflowRunId, workspaceId, 'info', 'Workflow processing completed', {
        outputId: aiOutput.insertedId.toString(),
        tokenEstimate: providerResult.tokenEstimate,
        provider: providerResult.provider,
        model: providerResult.model,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown workflow error';
      const failedAt = new Date();

      await this.mongo.collection<StoredWorkflowRun>('workflow_runs').updateOne(
        { _id: runObjectId },
        {
          $set: {
            status: 'FAILED',
            failedAt,
            updatedAt: failedAt,
            errorMessage: message,
          },
        },
      );

      await this.writeLog(workflowRunId, workspaceId, 'error', 'Workflow processing failed', {
        errorMessage: message,
      });

      throw error;
    }
  }

  private async writeLog(
    workflowRunId: string,
    workspaceId: string,
    level: string,
    message: string,
    metadata?: Record<string, unknown>,
  ) {
    await this.mongo.collection<ExecutionLog>('execution_logs').insertOne({
      workflowRunId,
      workspaceId,
      level,
      message,
      metadata,
      createdAt: new Date(),
    });
  }

  private objectId(value: string) {
    try {
      return new ObjectId(value);
    } catch {
      throw new Error(`Invalid ObjectId: ${value}`);
    }
  }
}
