output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.app_bucket.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.app_bucket.arn
}

output "dynamodb_table_name" {
  description = "The name of the DynamoDB table"
  value       = aws_dynamodb_table.app_table.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.app_table.arn
}

output "api_gateway_url" {
  description = "The URL of the API Gateway endpoint"
  value       = "${aws_apigatewayv2_stage.main.invoke_url}/colors"
}

output "submit_color_function_name" {
  description = "The name of the submit color Lambda function"
  value       = aws_lambda_function.submit_color.function_name
}

output "search_colors_function_name" {
  description = "The name of the search colors Lambda function"
  value       = aws_lambda_function.search_colors.function_name
}

output "website_bucket_name" {
  description = "The name of the S3 bucket for the website"
  value       = aws_s3_bucket.website.id
}

output "website_url" {
  description = "The URL of the website"
  value       = "https://${var.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.id
} 