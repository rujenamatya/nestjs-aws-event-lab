import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteMessageCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { HelloEventsRepository } from '../hello-events/hello-events.repository';
import { KafkaPublisher } from './kafka.publisher';

interface SnsEnvelope {
  Type: string;
  Message: string;
}

interface HelloEventCreatedPayload {
  type: 'HELLO_EVENT_CREATED';
  id: string;
  message: string;
  createdAt: string;
}

@Injectable()
export class SqsConsumer {
  private readonly logger = new Logger(SqsConsumer.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly kafkaPublisher: KafkaPublisher,
    private readonly helloEventsRepository: HelloEventsRepository,
  ) {
    const region = this.configService.getOrThrow<string>('aws.region');
    this.queueUrl = this.configService.get<string>('aws.sqsQueueUrl', '');
    this.sqsClient = new SQSClient({ region });
  }

  async pollForever(): Promise<void> {
    if (!this.queueUrl) {
      throw new Error('SQS_QUEUE_URL is not configured');
    }

    this.logger.log('Worker started. Polling SQS...');

    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.pollOnce();
    }
  }

  private async pollOnce(): Promise<void> {
    const response = await this.sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      }),
    );

    const messages = response.Messages ?? [];
    if (messages.length === 0) {
      return;
    }

    for (const message of messages) {
      await this.processMessage(message);
    }
  }

  private async processMessage(message: Message): Promise<void> {
    if (!message.Body || !message.ReceiptHandle) {
      return;
    }

    try {
      const envelope = JSON.parse(message.Body) as SnsEnvelope;
      const payload = JSON.parse(envelope.Message) as HelloEventCreatedPayload;

      this.logger.log(`Processing SQS message for eventId=${payload.id}`);

      await this.kafkaPublisher.publish({
        eventId: payload.id,
        message: payload.message,
        emittedAt: new Date().toISOString(),
      });

      await this.helloEventsRepository.updateStatus(payload.id, 'KAFKA_PUBLISHED');

      await this.sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        }),
      );

      this.logger.log(`Processed and deleted SQS message for eventId=${payload.id}`);
    } catch (error) {
      const messageId = message.MessageId ?? 'unknown';
      this.logger.error(
        `Failed to process SQS message. messageId=${messageId}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
