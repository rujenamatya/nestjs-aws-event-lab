import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../src/config/configuration';
import { validateEnv } from '../src/config/env.validation';
import { HelloEventsRepository } from '../src/hello-events/hello-events.repository';
import { KafkaPublisher } from '../src/messaging/kafka.publisher';
import { SqsConsumer } from '../src/messaging/sqs.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
  ],
  providers: [HelloEventsRepository, KafkaPublisher, SqsConsumer],
})
export class WorkerModule {}
