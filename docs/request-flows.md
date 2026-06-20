# InsightFlow Request Flows

This document captures the most important API and workflow journeys.

---

## 1. Owner registration flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as AuthController
    participant S as AuthService
    participant P as PostgreSQL

    C->>A: POST /api/auth/register
    A->>S: registerOwner(dto)
    S->>P: create user
    S->>P: create workspace
    S->>P: create owner membership
    S->>S: issue access/refresh tokens
    S->>P: store refresh token hash
    S-->>A: user + workspace + session
    A-->>C: JSON response
```

---

## 2. Document ingestion flow

```mermaid
sequenceDiagram
    participant U as User
    participant D as DocumentsController
    participant S as DocumentsService
    participant P as PostgreSQL
    participant M as MongoDB

    U->>D: POST /api/documents
    D->>S: create(dto)
    S->>P: validate membership
    S->>M: insert document
    S->>P: create usage event (DOCUMENTS)
    S-->>D: document created response
    D-->>U: JSON response
```

---

## 3. AI workflow queue + worker flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as AiJobsController
    participant S as AiJobsService
    participant Q as BullMQ / Redis
    participant W as AiJobsProcessor
    participant M as MongoDB
    participant P as PostgreSQL
    participant AI as AiProviderService

    U->>C: POST /api/ai-jobs
    C->>S: create(dto)
    S->>P: validate membership
    S->>M: create workflow run (QUEUED)
    S->>M: write log (queued)
    S->>Q: enqueue job
    S-->>U: queued response

    Q->>W: deliver job
    W->>M: update run to PROCESSING
    W->>M: write log (started)
    W->>M: load document
    W->>AI: process(document, type)
    AI-->>W: output + token estimate
    W->>M: store ai_output
    W->>M: update run to COMPLETED
    W->>P: create usage events
    W->>M: write log (completed)
```

---

## 4. Workflow failure + retry flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as AiJobsController
    participant S as AiJobsService
    participant Q as BullMQ / Redis
    participant W as AiJobsProcessor
    participant M as MongoDB

    W->>M: mark workflow FAILED
    W->>M: write failure log

    U->>C: POST /api/ai-jobs/:workspaceId/runs/:workflowRunId/retry
    C->>S: retry(user, workspace, workflowRunId)
    S->>M: validate run exists and is FAILED
    S->>Q: enqueue retry job
    S->>M: reset run to QUEUED
    S->>M: write retry log
    S-->>U: retry queued response
```

---

## 5. Usage overview flow

1. authenticated user calls `GET /api/usage/:workspaceId/overview`
2. service validates membership
3. recent usage events are fetched from PostgreSQL
4. usage is grouped by metric (`TOKENS`, `DOCUMENTS`, `WORKFLOW_RUNS`)
5. soft limits are resolved from workspace plan
6. remaining quota is calculated and returned
