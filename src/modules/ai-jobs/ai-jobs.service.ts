import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JobType } from '../../common/ai-types';
import { MongoService } from '../../common/mongo.service';
import { PrismaService } from '../../common/prisma.service';
import { QueueService } from '../../common/queue.service';
import { CreateAiJobDto } from './dto/create-ai-job.dto';
import { ObjectId } from 'mongodb';

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
  _id?: ObjectId;
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
    await this.writeLog(inserted.insertedId.toString(), payload.workspaceId, 'info', 'Workflow queued for processing', {
      documentId: payload.documentId,
      type: payload.type,
    });

    const queuedJob = await this.queueService.enqueueDocumentJob('workflow-run', {
      workflowRunId: inserted.insertedId.toString(),
      workspaceId: payload.workspaceId,
      documentId: payload.documentId,
      requestedById: userId,
      type: payload.type,
    });

    await this.mongo.collection<StoredWorkflowRun>('workflow_runs').updateOne(
      { _id: inserted.insertedId },
      {
        $set: {
          queueJobId: String(queuedJob.id),
          updatedAt: new Date(),
        },
      },
    );

    return {
      message: 'AI workflow queued successfully',
      workflowRunId: inserted.insertedId.toString(),
      queue: queuedJob,
      status: 'QUEUED',
    };
  }

  async list(userId: string, workspaceId: string) {
    await this.assertMembership(userId, workspaceId);
    const jobs = await this.mongo.collection<StoredWorkflowRun>('workflow_runs').find({ workspaceId }).sort({ createdAt: -1 }).toArray();
    return jobs.map((job) => ({ ...job, _id: job._id?.toString() }));
  }

  async detail(userId: string, workspaceId: string, workflowRunId: string) {
    await this.assertMembership(userId, workspaceId);

    const workflowRun = await this.mongo.collection<StoredWorkflowRun>('workflow_runs').findOne({
      _id: this.objectId(workflowRunId),
      workspaceId,
    });

    if (!workflowRun) throw new NotFoundException('Workflow run not found');

    const [output, logs] = await Promise.all([
      workflowRun.outputRef
        ? this.mongo.collection<AiOutput>('ai_outputs').findOne({ _id: this.objectId(workflowRun.outputRef), workspaceId })
        : Promise.resolve(null),
      this.mongo
        .collection<ExecutionLog>('execution_logs')
        .find({ workflowRunId, workspaceId })
        .sort({ createdAt: 1 })
        .toArray(),
    ]);

    return {
      ...workflowRun,
      _id: workflowRun._id?.toString(),
      output: output
        ? {
            ...output,
            _id: output._id?.toString(),
          }
        : null,
      logs,
    };
  }

  async retry(userId: string, workspaceId: string, workflowRunId: string) {
    await this.assertMembership(userId, workspaceId);

    const workflowRun = await this.mongo.collection<StoredWorkflowRun>('workflow_runs').findOne({
      _id: this.objectId(workflowRunId),
      workspaceId,
    });

    if (!workflowRun) throw new NotFoundException('Workflow run not found');
    if (workflowRun.status !== 'FAILED') {
      throw new ForbiddenException('Only failed workflow runs can be retried');
    }

    const queuedJob = await this.queueService.enqueueDocumentJob('workflow-run', {
      workflowRunId,
      workspaceId,
      documentId: workflowRun.documentId,
      requestedById: workflowRun.requestedById,
      type: workflowRun.type,
    });

    const now = new Date();
    await this.mongo.collection<StoredWorkflowRun>('workflow_runs').updateOne(
      { _id: workflowRun._id },
      {
        $set: {
          status: 'QUEUED',
          queueJobId: String(queuedJob.id),
          updatedAt: now,
        },
        $unset: {
          errorMessage: '',
          failedAt: '',
          startedAt: '',
          completedAt: '',
        },
      },
    );

    await this.writeLog(workflowRunId, workspaceId, 'info', 'Workflow re-queued for retry', {
      queueJobId: String(queuedJob.id),
    });

    return {
      message: 'Workflow retry queued successfully',
      workflowRunId,
      queue: queuedJob,
      status: 'QUEUED',
    };
  }

  private async assertMembership(userId: string, workspaceId: string) {
    const membership = await this.prisma.membership.findFirst({ where: { userId, workspaceId } });
    if (!membership) throw new ForbiddenException('You do not belong to this workspace');
    return membership;
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
      throw new NotFoundException('Invalid identifier');
    }
  }
}
