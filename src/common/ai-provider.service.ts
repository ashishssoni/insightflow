import { Injectable } from '@nestjs/common';
import { env } from '../config/env';
import { DocumentKind, JobType } from './ai-types';

@Injectable()
export class AiProviderService {
  async process(input: {
    title: string;
    content: string;
    kind: DocumentKind;
    jobType: JobType;
  }) {
    const shortened = input.content.slice(0, 180);

    return {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      output: {
        summary: `Mock ${input.jobType.toLowerCase()} result for \"${input.title}\"`,
        insights: [
          `${input.kind.toLowerCase()} processed successfully`,
          'Ready for review by the workspace team',
          `Preview: ${shortened}${input.content.length > 180 ? '…' : ''}`,
        ],
      },
      tokenEstimate: Math.max(120, Math.ceil(input.content.length / 4)),
    };
  }
}
