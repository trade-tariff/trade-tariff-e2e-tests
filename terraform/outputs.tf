output "scheduler_arn" {
  value       = aws_scheduler_schedule.e2e_10min_loop.arn
  description = "The Amazon Resource Name of the 10-minute production loop scheduler"
}

output "api_destination_arn" {
  value       = aws_cloudwatch_event_api_destination.github_api_target.arn
  description = "The API destination endpoint map ARN used for GitHub REST communication"
}
