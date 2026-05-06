data "aws_iam_policy_document" "app_permissions" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem"
    ]
    resources = [aws_dynamodb_table.hello_events.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "sns:Publish"
    ]
    resources = [aws_sns_topic.hello_events_created.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ChangeMessageVisibility"
    ]
    resources = [aws_sqs_queue.hello_events_queue.arn]
  }
}

resource "aws_iam_policy" "hello_events_app_policy" {
  name        = "hello-events-app-policy"
  description = "Minimum permissions for hello-events app and worker"
  policy      = data.aws_iam_policy_document.app_permissions.json
}
