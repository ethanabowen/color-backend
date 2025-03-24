# Lambda Function
resource "aws_lambda_function" "color_service" {
  filename         = data.archive_file.color_service_zip.output_path
  function_name    = "${var.project_name}-color-service-${var.environment}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "functions/colorService/handler.handler"
  runtime         = "nodejs20.x"
  source_code_hash = data.archive_file.color_service_zip.output_base64sha256
  timeout         = 30
  memory_size     = 128
  publish         = true

  environment {
    variables = {
      TABLE_NAME  = aws_dynamodb_table.app_table.name
      WEBSITE_URL = "https://${aws_cloudfront_distribution.website.domain_name}"
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda IAM Role
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda IAM Policy
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          aws_dynamodb_table.app_table.arn,
          "${aws_dynamodb_table.app_table.arn}/index/*",
          "arn:aws:logs:*:*:*"
        ]
      }
    ]
  })
}

# Lambda ZIP Archive
data "archive_file" "color_service_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../dist"
  output_path = "${path.module}/../dist/color-service.zip"
  excludes    = ["color-service.zip"]
}