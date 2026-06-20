import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { env } from '../config/env';

@Injectable()
export class QueueService {
  private readonly jobsQueue = new Queue('insightflow-ai-jobs', {
    connection: { url: env.REDIS_URL },
  });

  async enqueueDocumentJob(name: string, payload: Record<string, unknown>) {
    const job = await this.jobsQueue.add(name, payload, {
      removeOnComplete: true,
      removeOnFail: 50,
    });

    return { id: job.id, name: job.name };
  }
}
