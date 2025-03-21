output "functions_bucket_name" {
  description = "Name of the Lambda functions bucket"
  value       = aws_s3_bucket.functions_bucket.id
}

output "functions_bucket_arn" {
  description = "ARN of the Lambda functions bucket"
  value       = aws_s3_bucket.functions_bucket.arn
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.app_table.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.app_table.arn
}

output "api_url" {
  value       = "${aws_apigatewayv2_stage.lambda_api.invoke_url}/colors"
  description = "URL of the API Gateway endpoint"
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway"
  value       = aws_apigatewayv2_api.lambda_api.arn
}

output "submit_color_function_name" {
  description = "Name of the submit color Lambda function"
  value       = aws_lambda_function.submit_color.function_name
}

output "submit_color_function_arn" {
  description = "ARN of the submit color Lambda function"
  value       = aws_lambda_function.submit_color.arn
}

output "search_colors_function_name" {
  description = "Name of the search colors Lambda function"
  value       = aws_lambda_function.search_colors.function_name
}

output "search_colors_function_arn" {
  description = "ARN of the search colors Lambda function"
  value       = aws_lambda_function.search_colors.arn
}

output "website_url" {
  description = "URL of the website"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "website_bucket" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.bucket
}

output "website_bucket_name" {
  value       = aws_s3_bucket.website.id
  description = "Name of the S3 bucket hosting the frontend website"
}

# Frontend deployment outputs
output "frontend_ci_access_key_id" {
  value       = aws_iam_access_key.frontend_ci.id
  description = "Access Key ID for frontend CI/CD"
}

output "frontend_ci_secret_access_key" {
  value       = aws_iam_access_key.frontend_ci.secret
  description = "Secret Access Key for frontend CI/CD"
  sensitive   = true
} 