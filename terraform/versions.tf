terraform {
  required_version = ">=1.12"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Service     = "trade-tariff-e2e-tests"
      ManagedBy   = "Terraform"
      Repository  = "trade-tariff-e2e-tests"
    }
  }
}
