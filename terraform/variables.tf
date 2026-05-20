variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "environment" {
  type        = string
  description = "Target deployment stage (e.g. production)"
  default     = "development"
}

variable "github_repository" {
  type        = string
  description = "The target repository path on GitHub"
  default     = "trade-tariff/trade-tariff-e2e-tests"
}

variable "sns_alert_topic_arn" {
  type        = string
  description = "The existing core platform SNS topic ARN used for routing production alerts to Slack"
  # Replace this default or supply it via terraform.tfvars / platform state references
  default = "arn:aws:sns:eu-west-2:844815912454:slack-topic"
}
