import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { JobType, jobTypes } from '../../../common/ai-types';

export class CreateAiJobDto {
  @ApiProperty({ example: 'cm_workspace_123' })
  @IsString()
  workspaceId!: string;

  @ApiProperty({ example: '665f2ce0b8829e2bbbe14f11' })
  @IsString()
  documentId!: string;

  @ApiProperty({ enum: jobTypes, example: 'SUMMARIZE' })
  @IsIn(jobTypes)
  type!: JobType;
}
