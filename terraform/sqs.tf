resource "aws_sqs_queue" "hello_events_dlq" {
  name = var.sqs_dlq_name
}

resource "aws_sqs_queue" "hello_events_queue" {
  name = var.sqs_queue_name

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.hello_events_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_sns_topic_subscription" "hello_events_sqs_subscription" {
  topic_arn = aws_sns_topic.hello_events_created.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.hello_events_queue.arn
}

resource "aws_sqs_queue_policy" "allow_sns_publish" {
  queue_url = aws_sqs_queue.hello_events_queue.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Allow-SNS-SendMessage"
        Effect    = "Allow"
        Principal = "*"
        Action    = "sqs:SendMessage"
        Resource  = aws_sqs_queue.hello_events_queue.arn
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = aws_sns_topic.hello_events_created.arn
          }
        }
      }
    ]
  })
}
