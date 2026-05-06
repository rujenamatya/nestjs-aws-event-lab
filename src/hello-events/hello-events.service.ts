import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SnsPublisher } from '../messaging/sns.publisher';
import { CreateHelloEventDto } from './dto/create-hello-event.dto';
import { HelloEvent } from './model/hello-event.model';
import { HelloEventsRepository } from './hello-events.repository';

@Injectable()
export class HelloEventsService {
  constructor(
    private readonly repository: HelloEventsRepository,
    private readonly snsPublisher: SnsPublisher,
  ) {}

  async create(dto: CreateHelloEventDto): Promise<HelloEvent> {
    const event: HelloEvent = {
      id: randomUUID(),
      message: dto.message,
      createdAt: new Date().toISOString(),
      status: 'CREATED',
    };

    await this.repository.create(event);
    await this.snsPublisher.publishHelloEventCreated(event);
    await this.repository.updateStatus(event.id, 'SNS_PUBLISHED');

    return { ...event, status: 'SNS_PUBLISHED' };
  }

  async getById(id: string): Promise<HelloEvent> {
    const event = await this.repository.findById(id);
    if (!event) {
      throw new NotFoundException(`Hello event not found: ${id}`);
    }
    return event;
  }
}
