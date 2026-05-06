output "dynamodb_table_name" {
  value = aws_dynamodb_table.hello_events.name
}

output "sns_topic_arn" {
  value = aws_sns_topic.hello_events_created.arn
}

output "sqs_queue_url" {
  value = aws_sqs_queue.hello_events_queue.url
}

output "sqs_queue_arn" {
  value = aws_sqs_queue.hello_events_queue.arn
}

output "aws_region" {
  value = var.aws_region
}
