# InsightFlow API Showcase

This file is written as a portfolio-facing walkthrough.

---

## 1. Register an AI workspace owner

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founder@insightflow.dev",
    "password": "StrongPass123!",
    "fullName": "Ashish Soni",
    "workspaceName": "InsightFlow Labs"
  }'
```

---

## 2. Login and capture tokens

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "founder@insightflow.dev",
    "password": "StrongPass123!"
  }'
```

---

## 3. Ingest a document

```bash
curl -X POST http://localhost:3001/api/documents \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "<workspace-id>",
    "title": "Customer Support Transcript - Enterprise Account",
    "kind": "TRANSCRIPT",
    "sourceUrl": "https://example.com/transcript/enterprise-001",
    "content": "Customer raised billing confusion, feature access blockers, and onboarding questions..."
  }'
```

---

## 4. Queue an AI workflow

```bash
curl -X POST http://localhost:3001/api/ai-jobs \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "<workspace-id>",
    "documentId": "<document-id>",
    "type": "SUMMARIZE"
  }'
```

---

## 5. Inspect workflow run details

```bash
curl -X GET http://localhost:3001/api/ai-jobs/<workspace-id>/runs/<workflow-run-id> \
  -H "Authorization: Bearer <access-token>"
```

This endpoint is useful in demos because it shows:
- workflow status
- provider/model metadata
- token estimates
- AI output payload
- execution logs

---

## 6. Check usage overview

```bash
curl -X GET http://localhost:3001/api/usage/<workspace-id>/overview \
  -H "Authorization: Bearer <access-token>"
```

This is strong portfolio material because it signals:
- quota awareness
- billing-readiness
- product analytics groundwork
- SaaS-friendly AI consumption tracking
