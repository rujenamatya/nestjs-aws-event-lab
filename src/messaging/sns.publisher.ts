import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { HelloEvent } from '../hello-events/model/hello-event.model';

@Injectable()
export class SnsPublisher {
  private readonly logger = new Logger(SnsPublisher.name);
  private readonly client: SNSClient;
  private readonly topicArn: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.getOrThrow<string>('aws.region');
    this.topicArn = this.configService.get<string>('aws.snsTopicArn', '');
    this.client = new SNSClient({ region });
  }

  async publishHelloEventCreated(event: HelloEvent): Promise<void> {
    if (!this.topicArn) {
      throw new Error('SNS_TOPIC_ARN is not configured');
    }

    const payload = {
      type: 'HELLO_EVENT_CREATED',
      id: event.id,
      message: event.message,
      createdAt: event.createdAt,
    };

    await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Message: JSON.stringify(payload),
      }),
    );

    this.logger.log(`Published hello event to SNS. eventId=${event.id}`);
  }
}
