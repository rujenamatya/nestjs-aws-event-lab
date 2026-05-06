export default () => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
  },
  aws: {
    region: process.env.AWS_REGION ?? 'us-east-1',
    dynamodbTableName: process.env.DYNAMODB_TABLE_NAME ?? 'hello-events',
    snsTopicArn: process.env.SNS_TOPIC_ARN ?? '',
    sqsQueueUrl: process.env.SQS_QUEUE_URL ?? '',
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID ?? 'hello-events-app',
    topic: process.env.KAFKA_TOPIC ?? 'hello-events',
  },
});
