# InsightFlow Architecture

## Current scope
This first iteration demonstrates a **hybrid data architecture** for an AI SaaS backend.

```mermaid
flowchart TD
    Client[Client / Admin] --> API[InsightFlow API]
    API --> PG[(PostgreSQL)]
    API --> MG[(MongoDB)]
    API --> RD[(Redis)]

    PG --> PGD[Users / Workspaces / Usage]
    MG --> MGD[Documents / Workflow Runs / AI Outputs / Logs]
```

## Why the split matters

### PostgreSQL handles
- relational identity and membership data
- organization/workspace structure
- usage and billing-friendly records

### MongoDB handles
- document payloads
- flexible AI outputs
- execution logs
- workflow run history
- embedding metadata

## Implemented modules
- Auth
- Workspaces
- Documents
- AI Jobs
- Usage

## Next iteration
- worker process
- provider abstraction
- billing module
- storage module
- vector metadata pipeline
