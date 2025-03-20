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
  description = "URL of the API Gateway endpoint"
  value       = "${aws_apigatewayv2_api.lambda_api.api_endpoint}/colors"
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
  value       = "http://${aws_s3_bucket.website.bucket}.s3-website-${data.aws_region.current.name}.amazonaws.com"
}

output "website_bucket" {
  description = "Name of the S3 bucket hosting the website"
  value       = aws_s3_bucket.website.bucket
}

output "website_bucket_name" {
  description = "The name of the S3 bucket for the website"
  value       = aws_s3_bucket.website.id
} 