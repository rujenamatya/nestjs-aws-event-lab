import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { HelloEvent, HelloEventStatus } from './model/hello-event.model';

@Injectable()
export class HelloEventsRepository {
  private readonly tableName: string;
  private readonly docClient: DynamoDBDocumentClient;

  constructor(private readonly configService: ConfigService) {
    this.tableName = this.configService.getOrThrow<string>('aws.dynamodbTableName');
    const region = this.configService.getOrThrow<string>('aws.region');
    const ddbClient = new DynamoDBClient({ region });
    this.docClient = DynamoDBDocumentClient.from(ddbClient);
  }

  async create(event: HelloEvent): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: event,
      }),
    );
  }

  async findById(id: string): Promise<HelloEvent | null> {
    const result = await this.docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      }),
    );

    return (result.Item as HelloEvent | undefined) ?? null;
  }

  async updateStatus(id: string, status: HelloEventStatus): Promise<void> {
    await this.docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET #status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': status },
      }),
    );
  }
}
