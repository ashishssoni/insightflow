import { MongoClient } from 'mongodb';
import { PrismaClient, UsageMetric, WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();
const mongo = new MongoClient(process.env.MONGODB_URL ?? 'mongodb://localhost:27017/insightflow');

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

async function main() {
  await mongo.connect();
  const db = mongo.db();

  const founder = await prisma.user.upsert({
    where: { email: 'founder@insightflow.dev' },
    update: { fullName: 'Ashish Soni', passwordHash: hashPassword('StrongPass123!'), emailVerified: true },
    create: { email: 'founder@insightflow.dev', fullName: 'Ashish Soni', passwordHash: hashPassword('StrongPass123!'), emailVerified: true },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@insightflow.dev' },
    update: { fullName: 'Insight Analyst', passwordHash: hashPassword('AnalystPass123!'), emailVerified: true },
    create: { email: 'analyst@insightflow.dev', fullName: 'Insight Analyst', passwordHash: hashPassword('AnalystPass123!'), emailVerified: true },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'insightflow-labs' },
    update: { name: 'InsightFlow Labs', plan: WorkspacePlan.PRO },
    create: { name: 'InsightFlow Labs', slug: 'insightflow-labs', plan: WorkspacePlan.PRO },
  });

  await prisma.membership.deleteMany({ where: { workspaceId: workspace.id } });
  await prisma.usageEvent.deleteMany({ where: { workspaceId: workspace.id } });

  await prisma.membership.createMany({
    data: [
      { userId: founder.id, workspaceId: workspace.id, role: WorkspaceRole.OWNER },
      { userId: analyst.id, workspaceId: workspace.id, role: WorkspaceRole.ANALYST },
    ],
  });

  await prisma.usageEvent.createMany({
    data: [
      { workspaceId: workspace.id, metric: UsageMetric.DOCUMENTS, quantity: 2, metadata: { source: 'seed' } },
      { workspaceId: workspace.id, metric: UsageMetric.WORKFLOW_RUNS, quantity: 2, metadata: { source: 'seed' } },
      { workspaceId: workspace.id, metric: UsageMetric.TOKENS, quantity: 2200, metadata: { source: 'seed' } },
    ],
  });

  await db.collection('documents').deleteMany({ workspaceId: workspace.id });
  await db.collection('workflow_runs').deleteMany({ workspaceId: workspace.id });
  await db.collection('ai_outputs').deleteMany({ workspaceId: workspace.id });
  await db.collection('execution_logs').deleteMany({ workspaceId: workspace.id });

  const docOne = await db.collection('documents').insertOne({
    workspaceId: workspace.id,
    uploadedById: founder.id,
    title: 'Q2 Customer Support Transcript',
    kind: 'TRANSCRIPT',
    content: 'Customers repeatedly ask for clearer onboarding instructions, pricing breakdowns, and team invite guidance.',
    summary: 'Customers need onboarding clarity and pricing transparency.',
    embeddingMetadata: { chunkCount: 1, embeddingNamespace: workspace.id },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const workflow = await db.collection('workflow_runs').insertOne({
    workspaceId: workspace.id,
    documentId: docOne.insertedId.toString(),
    requestedById: founder.id,
    type: 'SUMMARIZE',
    status: 'COMPLETED',
    provider: 'mock',
    model: 'gpt-4o-mini',
    tokenEstimate: 1100,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.collection('ai_outputs').insertOne({
    workflowRunId: workflow.insertedId.toString(),
    workspaceId: workspace.id,
    documentId: docOne.insertedId.toString(),
    type: 'SUMMARIZE',
    provider: 'mock',
    model: 'gpt-4o-mini',
    output: {
      summary: 'Customers need onboarding clarity and pricing transparency.',
      insights: ['Pricing questions dominate support volume', 'Invite flow causes onboarding friction'],
    },
    createdAt: new Date(),
  });

  await db.collection('execution_logs').insertOne({
    workflowRunId: workflow.insertedId.toString(),
    workspaceId: workspace.id,
    level: 'info',
    message: 'Seed workflow completed successfully',
    createdAt: new Date(),
  });

  console.log('Seeded InsightFlow demo data successfully.');
  console.log('Founder login: founder@insightflow.dev / StrongPass123!');
  console.log('Analyst login: analyst@insightflow.dev / AnalystPass123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await mongo.close();
  });
