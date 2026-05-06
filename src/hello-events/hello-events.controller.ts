import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateHelloEventDto } from './dto/create-hello-event.dto';
import { HelloEventResponseDto } from './dto/hello-event-response.dto';
import { HelloEventsService } from './hello-events.service';

@Controller('hello-events')
export class HelloEventsController {
  constructor(private readonly helloEventsService: HelloEventsService) {}

  @Post()
  async create(
    @Body() dto: CreateHelloEventDto,
  ): Promise<HelloEventResponseDto> {
    return this.helloEventsService.create(dto);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<HelloEventResponseDto> {
    return this.helloEventsService.getById(id);
  }
}
