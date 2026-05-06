import { Module } from '@nestjs/common';
import { HelloEventsController } from './hello-events.controller';
import { HelloEventsService } from './hello-events.service';
import { HelloEventsRepository } from './hello-events.repository';
import { SnsPublisher } from '../messaging/sns.publisher';

@Module({
  controllers: [HelloEventsController],
  providers: [HelloEventsService, HelloEventsRepository, SnsPublisher],
  exports: [HelloEventsRepository],
})
export class HelloEventsModule {}
