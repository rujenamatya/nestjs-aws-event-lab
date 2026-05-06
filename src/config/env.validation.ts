import { plainToInstance } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  AWS_REGION!: string;

  @IsOptional()
  @IsString()
  DYNAMODB_TABLE_NAME!: string;

  @IsOptional()
  @IsString()
  SNS_TOPIC_ARN?: string;

  @IsOptional()
  @IsString()
  SQS_QUEUE_URL?: string;

  @IsOptional()
  @IsString()
  KAFKA_BROKERS?: string;

  @IsOptional()
  @IsString()
  KAFKA_CLIENT_ID?: string;

  @IsOptional()
  @IsString()
  KAFKA_TOPIC?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}
