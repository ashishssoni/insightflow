import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default('0.0.0.0'),
  APP_NAME: z.string().default('InsightFlow API'),
  APP_URL: z.string().url().default('http://localhost:3001'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/insightflow'),
  MONGODB_URL: z.string().default('mongodb://localhost:27017/insightflow'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string().min(10).default('change-me-access'),
  JWT_REFRESH_SECRET: z.string().min(10).default('change-me-refresh'),
  AI_PROVIDER: z.string().default('mock'),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  STORAGE_BUCKET: z.string().default('insightflow-local'),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);
