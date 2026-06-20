import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cors from '@fastify/cors';
import { AppModule } from './app.module';
import { PrismaService } from './common/prisma.service';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('InsightFlow API')
    .setDescription('AI workflow backend starter for document processing, usage metering, and multi-tenant SaaS products.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .addTag('Core')
    .addTag('Auth')
    .addTag('Workspaces')
    .addTag('Documents')
    .addTag('AI Jobs')
    .addTag('Usage')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  await app.listen(env.PORT, env.HOST);
  const logger = new Logger('Bootstrap');
  logger.log(`InsightFlow API running at ${env.APP_URL}/api`);
  logger.log(`Swagger docs available at ${env.APP_URL}/docs`);
}

void bootstrap();
