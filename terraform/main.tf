#-------------------------------------------------------------------------------
# 1. API Destination Connection (Houses Auth Details Securely)
#-------------------------------------------------------------------------------
resource "aws_cloudwatch_event_connection" "github_api_conn" {
  name               = "trade-tariff-e2e-${var.environment}-github-connection"
  description        = "Authenticated webhook pipeline connection to GitHub Actions REST API"
  authorization_type = "API_KEY"

  auth_parameters {
    api_key {
      key   = "Authorization"
      value = "Bearer ${data.aws_secretsmanager_secret_version.github_token_latest.secret_string}"
    }
  }
}

#-------------------------------------------------------------------------------
# 2. API Destination Endpoint Mapping
#-------------------------------------------------------------------------------
resource "aws_cloudwatch_event_api_destination" "github_api_target" {
  name                             = "trade-tariff-e2e-${var.environment}-api-target"
  description                      = "Targets workflow dispatch endpoint for check-production.yml"
  invocation_endpoint              = "https://api.github.com/repos/${var.github_repository}/actions/workflows/check-production.yml/dispatches"
  http_method                      = "POST"
  connection_arn                   = aws_cloudwatch_event_connection.github_api_conn.arn
  invocation_rate_limit_per_second = 1
}

#-------------------------------------------------------------------------------
# 3. IAM Execution Role for AWS Scheduler
#-------------------------------------------------------------------------------
resource "aws_iam_role" "scheduler_role" {
  name = "trade-tariff-e2e-${var.environment}-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "scheduler.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "scheduler_invoke_policy" {
  name        = "trade-tariff-e2e-${var.environment}-scheduler-invoke-policy"
  description = "Allows AWS Scheduler to put events onto the default EventBridge bus"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["events:PutEvents"]
        Resource = [
          "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:event-bus/default"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "scheduler_attach" {
  role       = aws_iam_role.scheduler_role.name
  policy_arn = aws_iam_policy.scheduler_invoke_policy.arn
}

resource "aws_iam_role" "eventbridge_invoke_role" {
  name = "trade-tariff-e2e-${var.environment}-eventbridge-invoke-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_policy" "eventbridge_invoke_policy" {
  name = "trade-tariff-e2e-${var.environment}-eventbridge-invoke-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["events:InvokeApiDestination"]
        Resource = [aws_cloudwatch_event_api_destination.github_api_target.arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge_invoke_attach" {
  role       = aws_iam_role.eventbridge_invoke_role.name
  policy_arn = aws_iam_policy.eventbridge_invoke_policy.arn
}

resource "aws_cloudwatch_event_rule" "catch_scheduler_event" {
  name        = "trade-tariff-e2e-${var.environment}-routing-rule"
  description = "Catches 10-minute scheduler events and forwards them to GitHub"

  event_pattern = jsonencode({
    source      = ["trade-tariff.e2e.scheduler"]
    detail-type = ["TriggerProductionWorkflow"]
  })
}

resource "aws_cloudwatch_event_target" "forward_to_github" {
  rule     = aws_cloudwatch_event_rule.catch_scheduler_event.name
  arn      = aws_cloudwatch_event_api_destination.github_api_target.arn
  role_arn = aws_iam_role.eventbridge_invoke_role.arn # ← dedicated role, not scheduler_role

  input_transformer {
    input_paths = {
      ref = "$.detail.ref"
    }
    # GitHub's dispatch endpoint expects exactly {"ref": "..."}
    input_template = "{\"ref\": <ref>}"
  }
}

#-------------------------------------------------------------------------------
# 4. Chronological 10-Minute Scheduler Rule Engine
#-------------------------------------------------------------------------------
resource "aws_scheduler_schedule" "e2e_10min_loop" {
  name        = "trade-tariff-e2e-${var.environment}-10min-loop"
  description = "Triggers the Playwright E2E production suite every 10 minutes"
  group_name  = "default"

  # state = var.environment == "production" ? "ENABLED" : "DISABLED"
  state = "ENABLED" # TEMPORARY FOR TESTING: Force it on in Dev

  schedule_expression          = "cron(*/10 * * * ? *)"
  schedule_expression_timezone = "UTC"

  flexible_time_window {
    mode = "OFF" # Ensures accurate 10-minute intervals without jitter window shifts
  }

  target {
    arn      = "arn:aws:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:event-bus/default"
    role_arn = aws_iam_role.scheduler_role.arn

    # Universal Targets require explicit payload inputs
    input = jsonencode({
      # ref = "main" # Forces execution against the main production test branch
      Entries = [
        {
          Source     = "trade-tariff.e2e.scheduler"
          DetailType = "TriggerProductionWorkflow"
          Detail = jsonencode({
            ref = "HMRC-2234-move-check-scheduling"
          })
          EventBusName = "default"
        }
      ]
    })

    retry_policy {
      maximum_event_age_in_seconds = 300
      maximum_retry_attempts       = 2
    }
  }
}

#-------------------------------------------------------------------------------
# 5. OBSERVABILITY: Alarm if Scheduler Fails to Push out to GitHub
#-------------------------------------------------------------------------------
resource "aws_cloudwatch_metric_alarm" "scheduler_delivery_failure" {
  alarm_name          = "trade-tariff-e2e-${var.environment}-scheduler-delivery-failure"
  alarm_description   = "FATAL: The EventBridge Scheduler missed target iterations or failed execution requests to GitHub for trade-tariff-e2e-tests."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "InvocationAttemptsFailed"
  namespace           = "AWS/Scheduler"
  period              = 600 # Evaluated across a 10-minute cadence loop
  statistic           = "Sum"
  threshold           = 0
  treat_missing_data  = "notBreaching"

  dimensions = {
    ScheduleName = aws_scheduler_schedule.e2e_10min_loop.name
  }

  alarm_actions = [var.sns_alert_topic_arn]
}

resource "aws_cloudwatch_log_group" "eventbridge_logs" {
  name              = "/aws/events/trade-tariff-e2e-${var.environment}"
  retention_in_days = 7
}

resource "aws_cloudwatch_event_target" "log_all_scheduler_events" {
  rule = aws_cloudwatch_event_rule.catch_scheduler_event.name
  arn  = aws_cloudwatch_log_group.eventbridge_logs.arn
}