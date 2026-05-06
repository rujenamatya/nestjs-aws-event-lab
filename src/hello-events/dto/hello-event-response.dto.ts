import { HelloEventStatus } from '../model/hello-event.model';

export class HelloEventResponseDto {
  id!: string;
  message!: string;
  createdAt!: string;
  status!: HelloEventStatus;
}
