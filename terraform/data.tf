data "aws_caller_identity" "current" {}

data "aws_secretsmanager_secret" "github_token" {
  name = "github-actions-dispatch-token"
}

data "aws_secretsmanager_secret_version" "github_token_latest" {
  secret_id = data.aws_secretsmanager_secret.github_token.id
}
