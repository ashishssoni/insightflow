# InsightFlow

> AI workflow backend starter for **document processing, usage-metered SaaS products, and workspace-based AI operations**.

InsightFlow is being built as a portfolio project to demonstrate how I would design the backend for an **AI SaaS product** that needs secure auth, multi-tenant workspaces, document ingestion, workflow execution, and usage tracking.

```mermaid
flowchart LR
    A[Clients / Internal Tools] --> B[InsightFlow API\nNestJS + Fastify]
    B --> C[(PostgreSQL)\nUsers / Organizations / Usage]
    B --> D[(MongoDB)\nDocuments / Workflow Runs / AI Outputs / Logs]
    B --> E[(Redis)\nQueue-ready / async jobs]
```

## Current implementation (about 60%)

### Core foundation completed
- NestJS API bootstrap
- Prisma + PostgreSQL integration
- MongoDB integration for AI workflow data
- Redis/BullMQ queue foundation
- JWT auth + refresh token flow
- multi-tenant workspaces and memberships
- document ingestion into MongoDB
- AI workflow execution with stored outputs and execution logs
- usage metering in PostgreSQL
- Swagger documentation
- demo seed data

## Data ownership split

### PostgreSQL
- Users
- Organizations / Workspaces
- Memberships / Roles
- Usage Events

### MongoDB
- Documents
- Workflow Runs
- AI Outputs
- Execution Logs
- Embeddings Metadata

## Available endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`
- `GET /api/workspaces`
- `GET /api/workspaces/:slug`
- `POST /api/documents`
- `GET /api/documents/:workspaceId`
- `GET /api/documents/:workspaceId/:documentId`
- `POST /api/ai-jobs`
- `GET /api/ai-jobs/:workspaceId`
- `GET /api/usage/:workspaceId/overview`

## Run locally

```bash
cp .env.example .env
docker compose up -d
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Swagger docs:
- `http://localhost:3001/docs`

## Demo accounts

- `founder@insightflow.dev` / `StrongPass123!`
- `analyst@insightflow.dev` / `AnalystPass123!`

## What is intentionally left for the next iteration

The project is **not complete yet**. The next commit cycle will focus on:

- real async workers instead of immediate mock completion
- billing and subscription layer for AI usage
- vector/embedding pipeline integration
- provider abstraction for OpenAI / Anthropic / Azure OpenAI
- file storage integration (S3/GCS)
- richer execution observability
- retry/failure handling for workflows
- admin/ops endpoints
- tests and CI polish
- richer HLD / LLD docs and portfolio assets

## Why this project matters

InsightFlow is meant to prove backend capability for clients building:
- AI SaaS products
- internal AI workflow systems
- document intelligence tools
- support automation backends
- knowledge processing pipelines
