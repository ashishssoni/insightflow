import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { DocumentKind, documentKinds } from '../../../common/ai-types';

export class CreateDocumentDto {
  @ApiProperty({ example: 'cm_workspace_123' })
  @IsString()
  workspaceId!: string;

  @ApiProperty({ example: 'Q2 Support Insights' })
  @IsString()
  @MinLength(2)
  title!: string;

  @ApiProperty({ enum: documentKinds, example: 'TRANSCRIPT' })
  @IsIn(documentKinds)
  kind!: DocumentKind;

  @ApiProperty({ example: 'https://example.com/files/support-call.txt', required: false })
  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @ApiProperty({ example: 'Customer support conversations show repeated questions about onboarding and pricing...' })
  @IsString()
  @MinLength(20)
  content!: string;
}
