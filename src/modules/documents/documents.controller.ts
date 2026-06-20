import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Ingest a document into an AI workspace' })
  create(@CurrentUser() user: { sub: string }, @Body() body: CreateDocumentDto) {
    return this.documentsService.create(user.sub, body);
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'List documents for a workspace' })
  list(@CurrentUser() user: { sub: string }, @Param('workspaceId') workspaceId: string) {
    return this.documentsService.list(user.sub, workspaceId);
  }

  @Get(':workspaceId/:documentId')
  @ApiOperation({ summary: 'Get a document with AI job history' })
  get(
    @CurrentUser() user: { sub: string },
    @Param('workspaceId') workspaceId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.documentsService.get(user.sub, workspaceId, documentId);
  }
}
