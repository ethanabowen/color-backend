# IAM user for GitHub Actions
resource "aws_iam_user" "github_actions" {
  name = "github-actions-deployer"
  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM policy for GitHub Actions - Consider applying principal of least privilege
resource "aws_iam_policy" "github_actions" {
  name = "github-actions-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          # AWS Gateway
          "apigateway:*",
          
          # CloudFront
          "cloudfront:Get*",
          "cloudfront:List*",
          
          # DynamoDB - Terraform state locks + App Tables
          "dynamodb:*",
          
          # IAM
          "iam:CreatePolicy",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicyVersion",
          "iam:Get*",
          "iam:List*",
          "iam:PassRole",
          
          # Lambda functions
          "lambda:Get*",
          "lambda:List*",
          "lambda:PublishVersion",
          "lambda:UpdateFunction*",
          
          # S3 - Terraform state bucket + App buckets
          "s3:DeleteObject",
          "s3:Get*",
          "s3:List*",
          "s3:PutObject"
        ]
        Resource = [
          # Api Gateway
          data.terraform_remote_state.application.outputs.api_gateway_arn,
          "${data.terraform_remote_state.application.outputs.api_gateway_arn}/*",
          "arn:aws:execute-api:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:${data.terraform_remote_state.application.outputs.api_gateway_id}/*",
          "arn:aws:apigateway:${data.aws_region.current.name}::/account",
          # CloudFront
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:distribution/${data.terraform_remote_state.application.outputs.cloudfront_distribution_id}",
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:cache-policy/${data.terraform_remote_state.application.outputs.cloudfront_cache_policy_id}",
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:origin-access-control/${data.terraform_remote_state.application.outputs.cloudfront_origin_access_control_id}",
          "arn:aws:cloudfront::${data.aws_caller_identity.current.account_id}:response-headers-policy/${data.terraform_remote_state.application.outputs.cloudfront_response_headers_policy_id}",
          # DynamoDB table
          data.terraform_remote_state.application.outputs.dynamodb_table_arn,
          "${data.terraform_remote_state.application.outputs.dynamodb_table_arn}/index/*",
          # Frontend
          aws_iam_policy.frontend_deployment.arn,
          aws_iam_user.frontend_ci.arn,
          # IAM resources
          data.terraform_remote_state.application.outputs.api_gateway_cloudwatch_role_arn,
          data.terraform_remote_state.application.outputs.lambda_role_arn,
          aws_iam_user.github_actions.arn,
          "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/github-actions-policy",
          # Lambda functions + role
          data.terraform_remote_state.application.outputs.color_service_function_arn,
          "${data.terraform_remote_state.application.outputs.color_service_function_arn}:*",
          # Lambda functions bucket
          data.terraform_remote_state.application.outputs.functions_bucket_arn,
          "${data.terraform_remote_state.application.outputs.functions_bucket_arn}/*",
          # Terraform state bucket
          "arn:aws:s3:::color-service-terraform-state",
          "arn:aws:s3:::color-service-terraform-state/*",
          # Terraform state locking table
          "arn:aws:dynamodb:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:table/color-service-terraform-state",
          # Website bucket
          "arn:aws:s3:::${data.terraform_remote_state.application.outputs.website_bucket_name}",
          "arn:aws:s3:::${data.terraform_remote_state.application.outputs.website_bucket_name}/*"
        ]
      }
    ]
  })
}

# Attach policy to user
resource "aws_iam_user_policy_attachment" "github_actions" {
  user       = aws_iam_user.github_actions.name
  policy_arn = aws_iam_policy.github_actions.arn
}

# Create access key for the user
resource "aws_iam_access_key" "github_actions" {
  user = aws_iam_user.github_actions.name
}

# Output the access key and secret (only shown once when created)
output "github_actions_access_key" {
  description = "The access key for GitHub Actions"
  value       = aws_iam_access_key.github_actions.id
  sensitive   = true
}

output "github_actions_secret_key" {
  description = "The secret key for GitHub Actions"
  value       = aws_iam_access_key.github_actions.secret
  sensitive   = true
} 