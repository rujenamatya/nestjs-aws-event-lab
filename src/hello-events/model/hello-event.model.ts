export type HelloEventStatus =
  | 'CREATED'
  | 'SNS_PUBLISHED'
  | 'SQS_PROCESSED'
  | 'KAFKA_PUBLISHED';

export interface HelloEvent {
  id: string;
  message: string;
  createdAt: string;
  status: HelloEventStatus;
}
