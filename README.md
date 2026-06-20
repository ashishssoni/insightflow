# InsightFlow

> Portfolio-grade **AI SaaS backend** showcasing **async AI processing, usage metering, multi-tenant workspaces, and a modern document intelligence architecture**.

```mermaid
flowchart LR
    A[Clients\nDashboard / Admin / Internal Tools] --> B[InsightFlow API\nNestJS + Fastify + Swagger]
    B --> C[Auth + Workspaces\nJWT + RBAC]
    B --> D[Documents + AI Jobs\nIngestion + Workflow APIs]
    B --> E[Usage Metering\nQuota-friendly event tracking]
    D --> F[(MongoDB)\nDocuments / Workflow Runs / AI Outputs / Logs]
    C --> G[(PostgreSQL)\nUsers / Workspaces / Memberships / Usage Events]
    D --> H[(Redis / BullMQ)\nAsync queue + retries]
```

InsightFlow is designed to look strong in a freelance portfolio or Upwork profile when pitching work such as:
- AI SaaS backend development
- async processing pipelines
- usage-metered products
- modern multi-tenant AI platforms
- document intelligence backends

## What this project demonstrates

- secure JWT auth with refresh token rotation
- multi-tenant workspace architecture
- hybrid persistence design with PostgreSQL + MongoDB
- document ingestion for AI workflows
- BullMQ-backed async AI processing
- execution logs and workflow status tracking
- usage event metering for billing-ready products
- clean NestJS module structure with Swagger docs

## Dual-database architecture highlight

This backend intentionally uses **2 databases** to model a more realistic AI SaaS platform.

```text
PostgreSQL
├── Users
├── Organizations
├── Billing
└── Usage

MongoDB
├── Workflow Runs
├── AI Outputs
├── Documents
├── Embeddings Metadata
└── Execution Logs
```

This is a strong portfolio signal because it shows deliberate system design: relational data stays structured and billing-friendly, while AI payloads and workflow traces stay flexible.

## Why this is a strong portfolio backend

This repo highlights the kind of backend architecture many AI product clients ask for:

```bash
insightflow/
  src/
    common/
    config/
    modules/
      health/
      auth/
      workspaces/
      documents/
      ai-jobs/
      usage/
    app.module.ts
    main.ts
  prisma/
  docs/
  docker-compose.yml
  .env.example
  package.json
  tsconfig.json
```

It is structured as a focused single-service backend, which makes it easier for clients to review quickly and understand the business value.

## Tech stack

- NestJS
- TypeScript
- Fastify adapter
- Swagger / OpenAPI
- Prisma ORM
- PostgreSQL
- MongoDB
- Redis
- BullMQ
- Docker Compose

## Current modules

- **Health** — API health endpoint
- **Auth** — registration, login, refresh, and profile flows
- **Workspaces** — tenant/workspace listing and detail APIs
- **Documents** — document ingestion and retrieval
- **AI Jobs** — workflow queueing, processing, execution logs, retries
- **Usage** — aggregated usage metrics and soft-limit overview

## Implemented backend capabilities

### Auth and tenant layer
- workspace-owner registration flow
- JWT access token authentication
- refresh token rotation
- membership-aware workspace access
- role-aware workspace data exposure

### Document intelligence foundation
- ingest notes, PDFs, tickets, contracts, and transcripts
- store raw document content in MongoDB
- attach lightweight embedding metadata placeholders
- fetch document details with workflow history

### Async AI workflow engine
- queue AI jobs through BullMQ
- transition runs across `QUEUED -> PROCESSING -> COMPLETED / FAILED`
- persist AI outputs separately from workflow metadata
- store execution logs for queue, processing, completion, and failure stages
- retry failed runs with exponential backoff

### Usage metering
- emit usage events for documents and workflow runs
- estimate and record token usage
- aggregate usage totals by workspace
- return soft limits and remaining quota for dashboard use

## API preview

- API base: `http://localhost:3001/api`
- Swagger docs: `http://localhost:3001/docs`

## Example endpoints

- `GET /api/health`
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
- `GET /api/ai-jobs/:workspaceId/runs/:workflowRunId`
- `POST /api/ai-jobs/:workspaceId/runs/:workflowRunId/retry`
- `GET /api/usage/:workspaceId/overview`

## Run locally

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

```bash
cp .env.example .env
```

### 3. Start local infrastructure

```bash
docker compose up -d
```

### 4. Generate Prisma client and sync schema

```bash
npx prisma generate
npx prisma db push
```

### 5. Seed demo data

```bash
npm run db:seed
```

### 6. Run the API

```bash
npm run dev
```

## Demo accounts

- **Founder:** `founder@insightflow.dev` / `StrongPass123!`
- **Analyst:** `analyst@insightflow.dev` / `AnalystPass123!`

## What this signals to clients

InsightFlow is meant to show that I can build:
- AI SaaS backends with clean service boundaries
- async job systems for long-running AI operations
- billing-ready usage tracking and quota models
- hybrid data models for structured + unstructured workloads
- multi-tenant products with secure workspace isolation

## Project status

InsightFlow now demonstrates the core backend story well, but it is **not fully complete** as a production platform.

### Already strong enough for showcase/demo
- AI SaaS backend
- async processing
- usage metering
- modern AI product backend architecture

### Best next upgrades
- real provider abstraction for OpenAI / Anthropic / Azure OpenAI
- object storage integration for uploaded files
- billing/subscription module
- vector indexing and retrieval pipeline
- tests, CI, and deployment polish
- admin/ops dashboards and observability

## Documentation

- `docs/index.md` — documentation index
- `docs/architecture.md` — system architecture overview
- `docs/hld.md` — high-level design
- `docs/lld.md` — low-level design
- `docs/data-model.md` — relational and document model
- `docs/request-flows.md` — important request and workflow flows
- `docs/api-showcase.md` — portfolio-facing API journey
- `docs/roadmap.md` — next-step expansion ideas
