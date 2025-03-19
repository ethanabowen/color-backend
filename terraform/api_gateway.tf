# API Gateway
resource "aws_apigatewayv2_api" "lambda_api" {
  name          = "${var.project_name}-${var.environment}-api"
  protocol_type = "HTTP"
  description   = "API Gateway for Lambda functions"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["*"]
    allow_methods     = ["GET", "POST", "OPTIONS"]
    allow_origins     = ["*"]
    expose_headers    = ["*"]
    max_age          = 300
  }
}

# API Stage
resource "aws_apigatewayv2_stage" "lambda_api" {
  api_id = aws_apigatewayv2_api.lambda_api.id
  name   = var.environment
  auto_deploy = true

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Lambda Integrations
resource "aws_apigatewayv2_integration" "submit_color" {
  api_id           = aws_apigatewayv2_api.lambda_api.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description         = "Submit color Lambda integration"
  integration_method  = "POST"
  integration_uri     = aws_lambda_function.submit_color.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "search_colors" {
  api_id           = aws_apigatewayv2_api.lambda_api.id
  integration_type = "AWS_PROXY"

  connection_type      = "INTERNET"
  description         = "Search colors Lambda integration"
  integration_method  = "POST"
  integration_uri     = aws_lambda_function.search_colors.invoke_arn
  payload_format_version = "2.0"
}

# API Routes
resource "aws_apigatewayv2_route" "submit_color" {
  api_id    = aws_apigatewayv2_api.lambda_api.id
  route_key = "POST /colors"
  target    = "integrations/${aws_apigatewayv2_integration.submit_color.id}"
}

resource "aws_apigatewayv2_route" "search_colors" {
  api_id    = aws_apigatewayv2_api.lambda_api.id
  route_key = "GET /colors"
  target    = "integrations/${aws_apigatewayv2_integration.search_colors.id}"
}

# Lambda Permissions
resource "aws_lambda_permission" "submit_color" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submit_color.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lambda_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "search_colors" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.search_colors.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.lambda_api.execution_arn}/*/*"
} 