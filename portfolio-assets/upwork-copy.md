# InsightFlow Upwork Copy

## Title
AI SaaS Backend with Async Processing, Usage Metering, and Dual-Database Architecture

## Short description
Built a modern AI SaaS backend with NestJS, PostgreSQL, MongoDB, Redis, and BullMQ featuring async AI workflow processing, usage metering, workflow runs, AI outputs, execution logs, and multi-tenant workspace architecture.

## Long description
InsightFlow is a backend-focused AI SaaS project built to demonstrate how I design scalable product backends for AI-enabled platforms.

The system includes secure authentication, multi-tenant workspace architecture, document ingestion, async AI workflow execution, workflow run tracking, execution logs, AI outputs, and billing-ready usage metering.

A major architectural highlight is the dual-database design: PostgreSQL handles structured business data such as users, organizations/workspaces, and usage events, while MongoDB stores documents, workflow runs, AI outputs, embeddings metadata, and execution logs. Redis and BullMQ power async job orchestration so long-running AI work is handled outside the request/response path.

This project is especially relevant for founders or teams building AI SaaS products, internal AI tools, document intelligence platforms, workflow automation systems, or usage-metered products.

## My role
I designed and implemented the backend architecture, API structure, workflow orchestration flow, data modeling strategy, async job design, and usage metering foundation with a focus on scalability, maintainability, and product-oriented backend patterns.

## Key features
- NestJS + TypeScript backend architecture
- Async AI workflow processing with Redis + BullMQ
- Multi-tenant workspace / organization structure
- PostgreSQL + MongoDB dual-database design
- Workflow runs, AI outputs, and execution logs
- Usage metering for tokens, documents, and workflow runs
- Queue retry flows and status transitions
- Swagger-ready API structure

## Tech stack
- Node.js
- TypeScript
- NestJS
- PostgreSQL
- Prisma
- MongoDB
- Redis
- BullMQ
- Swagger / OpenAPI
- Docker

## Skills
- Backend Development
- Node.js
- TypeScript
- NestJS
- PostgreSQL
- MongoDB
- Redis
- AI Development
- API Development
- SaaS Development
- Workflow Automation
- System Architecture
