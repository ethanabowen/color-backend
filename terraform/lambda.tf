# Lambda Functions
resource "aws_lambda_function" "submit_color" {
  filename         = data.archive_file.submit_color_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-submit-color"
  role            = aws_iam_role.lambda_role.arn
  handler         = "functions/submitColor/handler.submitColor"
  runtime         = "nodejs20.x"
  source_code_hash = data.archive_file.submit_color_zip.output_base64sha256
  timeout         = 30
  memory_size     = 128
  publish         = true

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.app_table.name
    }
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_lambda_function" "search_colors" {
  filename         = data.archive_file.search_colors_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-search-colors"
  role            = aws_iam_role.lambda_role.arn
  handler         = "functions/searchColors/handler.searchColors"
  runtime         = "nodejs20.x"
  source_code_hash = data.archive_file.search_colors_zip.output_base64sha256
  timeout         = 30
  memory_size     = 128
  publish         = true

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.app_table.name
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

# Lambda ZIP Archives
data "archive_file" "submit_color_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src"
  output_path = "${path.module}/../dist/submit-color.zip"
  excludes    = ["functions/searchColors"]
}

data "archive_file" "search_colors_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../src"
  output_path = "${path.module}/../dist/search-colors.zip"
  excludes    = ["functions/submitColor"]
} 