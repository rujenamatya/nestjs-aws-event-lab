import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SqsConsumer } from '../src/messaging/sqs.consumer';
import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  const logger = new Logger('WorkerBootstrap');
  const sqsConsumer = app.get(SqsConsumer);

  logger.log('Starting SQS worker process');
  await sqsConsumer.pollForever();
}

void bootstrap();
