import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { MongoService } from '../../common/mongo.service';
import { PrismaService } from '../../common/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

type StoredDocument = {
  _id?: ObjectId;
  workspaceId: string;
  uploadedById: string;
  title: string;
  kind: string;
  sourceUrl?: string;
  content: string;
  summary?: string;
  embeddingMetadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mongo: MongoService,
  ) {}

  async create(userId: string, payload: CreateDocumentDto) {
    await this.assertMembership(userId, payload.workspaceId);

    const now = new Date();
    const document: StoredDocument = {
      workspaceId: payload.workspaceId,
      uploadedById: userId,
      title: payload.title,
      kind: payload.kind,
      sourceUrl: payload.sourceUrl,
      content: payload.content,
      embeddingMetadata: {
        chunkCount: Math.max(1, Math.ceil(payload.content.length / 500)),
        embeddingNamespace: payload.workspaceId,
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.mongo.collection<StoredDocument>('documents').insertOne(document);

    await this.prisma.usageEvent.create({
      data: {
        workspaceId: payload.workspaceId,
        metric: 'DOCUMENTS',
        quantity: 1,
        metadata: { documentId: result.insertedId.toString(), title: payload.title },
      },
    });

    return {
      message: 'Document ingested successfully',
      document: {
        id: result.insertedId.toString(),
        workspaceId: payload.workspaceId,
        title: payload.title,
        kind: payload.kind,
        createdAt: now,
      },
    };
  }

  async list(userId: string, workspaceId: string) {
    await this.assertMembership(userId, workspaceId);
    const documents = await this.mongo
      .collection<StoredDocument>('documents')
      .find({ workspaceId })
      .sort({ createdAt: -1 })
      .toArray();

    return documents.map((document) => ({
      id: document._id?.toString(),
      title: document.title,
      kind: document.kind,
      sourceUrl: document.sourceUrl,
      summary: document.summary,
      uploadedById: document.uploadedById,
      createdAt: document.createdAt,
      embeddingMetadata: document.embeddingMetadata,
    }));
  }

  async get(userId: string, workspaceId: string, documentId: string) {
    await this.assertMembership(userId, workspaceId);

    const document = await this.mongo.collection<StoredDocument>('documents').findOne({
      _id: this.objectId(documentId),
      workspaceId,
    });

    if (!document) throw new NotFoundException('Document not found');

    const jobs = await this.mongo
      .collection('workflow_runs')
      .find({ workspaceId, documentId })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      id: document._id?.toString(),
      workspaceId: document.workspaceId,
      title: document.title,
      kind: document.kind,
      sourceUrl: document.sourceUrl,
      content: document.content,
      summary: document.summary,
      embeddingMetadata: document.embeddingMetadata,
      jobs: jobs.map((job) => ({ ...job, _id: job._id?.toString() })),
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
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
