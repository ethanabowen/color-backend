# Lambda IAM role
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

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

  tags = local.common_tags
}

# Lambda IAM policy
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.app_table.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda function for submitting colors
resource "aws_lambda_function" "submit_color" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.name_prefix}-submit-color"
  role            = aws_iam_role.lambda_role.arn
  handler         = "functions/submitColor.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 128
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.app_table.name
    }
  }

  tags = local.common_tags
}

# Lambda function for searching colors
resource "aws_lambda_function" "search_colors" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.name_prefix}-search-colors"
  role            = aws_iam_role.lambda_role.arn
  handler         = "functions/searchColors.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 128
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.app_table.name
    }
  }

  tags = local.common_tags
}

# API Gateway
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "API for favorite colors application"

  tags = local.common_tags
}

# API Gateway CORS configuration
resource "aws_apigatewayv2_cors_configuration" "main" {
  api_id = aws_apigatewayv2_api.main.id

  allow_credentials = true
  allow_headers     = ["*"]
  allow_methods     = ["*"]
  allow_origins     = ["http://localhost:5173"]  # Frontend development URL
  expose_headers    = ["*"]
  max_age          = 300
}

# API Gateway stage
resource "aws_apigatewayv2_stage" "main" {
  api_id = aws_apigatewayv2_api.main.id
  name   = var.environment
  auto_deploy = true

  tags = local.common_tags
}

# API Gateway integrations
resource "aws_apigatewayv2_integration" "submit_color" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.submit_color.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "search_colors" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.search_colors.invoke_arn
  payload_format_version = "2.0"
}

# API Gateway routes
resource "aws_apigatewayv2_route" "submit_color" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /colors"
  target    = "integrations/${aws_apigatewayv2_integration.submit_color.id}"
}

resource "aws_apigatewayv2_route" "search_colors" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /colors"
  target    = "integrations/${aws_apigatewayv2_integration.search_colors.id}"
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "submit_color" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_color.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "search_colors" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_colors.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# Lambda function code archive
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src"
  output_path = "${path.module}/lambda.zip"
} 