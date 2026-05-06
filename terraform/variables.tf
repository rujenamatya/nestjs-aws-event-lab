variable "aws_region" {
  type        = string
  description = "AWS region for resources"
  default     = "us-east-1"
}

variable "dynamodb_table_name" {
  type        = string
  description = "DynamoDB table name"
  default     = "hello-events"
}

variable "sns_topic_name" {
  type        = string
  description = "SNS topic name"
  default     = "hello-events-created"
}

variable "sqs_queue_name" {
  type        = string
  description = "SQS queue name"
  default     = "hello-events-created-queue"
}

variable "sqs_dlq_name" {
  type        = string
  description = "SQS dead-letter queue name"
  default     = "hello-events-created-dlq"
}
