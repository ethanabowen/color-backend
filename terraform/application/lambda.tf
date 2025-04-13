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

  vpc_config {
    subnet_ids         = data.terraform_remote_state.networking.outputs.private_subnet_ids
    security_group_ids = [data.terraform_remote_state.networking.outputs.lambda_security_group_id]
  }

  environment {
    variables = {
      TABLE_NAME  = aws_dynamodb_table.app_table.name
      WEBSITE_URL = "https://${aws_cloudfront_distribution.website.domain_name}"
      DEBUG       = "*"
    }
  }

  tags = local.common_tags
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

  tags = local.common_tags
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
          "dynamodb:GetItem"
        ]
        Resource = [
          aws_dynamodb_table.app_table.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.app_table.arn,
          "${aws_dynamodb_table.app_table.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${aws_lambda_function.color_service.function_name}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:AssignPrivateIpAddresses",
          "ec2:UnassignPrivateIpAddresses"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda ZIP Archive
data "archive_file" "color_service_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../../dist"
  output_path = "${path.module}/../../dist/color-service.zip"
  excludes    = ["color-service.zip"]
}