resource "aws_sns_topic" "hello_events_created" {
  name = var.sns_topic_name
}
