import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaPublisher implements OnApplicationShutdown {
  private readonly logger = new Logger(KafkaPublisher.name);
  private readonly producer: Producer;
  private readonly topic: string;
  private connected = false;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.getOrThrow<string[]>('kafka.brokers');
    const clientId = this.configService.getOrThrow<string>('kafka.clientId');
    this.topic = this.configService.getOrThrow<string>('kafka.topic');

    const kafka = new Kafka({
      clientId,
      brokers,
    });

    this.producer = kafka.producer();
  }

  async publish(value: Record<string, unknown>): Promise<void> {
    if (!this.connected) {
      await this.producer.connect();
      this.connected = true;
    }

    await this.producer.send({
      topic: this.topic,
      messages: [{ value: JSON.stringify(value) }],
    });

    this.logger.log(`Published message to Kafka topic=${this.topic}`);
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.connected) {
      await this.producer.disconnect();
      this.connected = false;
    }
  }
}
