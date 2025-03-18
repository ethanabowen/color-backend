# API Gateway
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "API Gateway for Favorite Color application"
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
}

# API Gateway integration for submit color
resource "aws_apigatewayv2_integration" "submit_color" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  description        = "Submit color Lambda integration"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.submit_color.invoke_arn
}

# API Gateway route for submit color
resource "aws_apigatewayv2_route" "submit_color" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /colors"
  target    = "integrations/${aws_apigatewayv2_integration.submit_color.id}"
}

# API Gateway integration for search colors
resource "aws_apigatewayv2_integration" "search_colors" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  description        = "Search colors Lambda integration"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.search_colors.invoke_arn
}

# API Gateway route for search colors
resource "aws_apigatewayv2_route" "search_colors" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /colors"
  target    = "integrations/${aws_apigatewayv2_integration.search_colors.id}"
}

# Lambda permission for API Gateway
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