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
  value       = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${var.environment}"
  description = "URL of the API Gateway endpoint"
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.api.arn
}

output "color_service_function_name" {
  description = "Name of the color service Lambda function"
  value       = aws_lambda_function.color_service.function_name
}

output "color_service_function_arn" {
  description = "ARN of the color service Lambda function"
  value       = aws_lambda_function.color_service.arn
}

output "website_url" {
  description = "URL of the website"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.id
}

output "website_bucket" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.bucket
}

output "website_bucket_name" {
  value       = aws_s3_bucket.website.id
  description = "Name of the S3 bucket hosting the frontend website"
}