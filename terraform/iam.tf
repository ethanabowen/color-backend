# Create the IAM policy for frontend deployment
resource "aws_iam_policy" "frontend_deployment" {
  name        = "${local.name_prefix}-frontend-deployment"
  description = "Policy for frontend CI/CD to deploy to S3"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket",
          "s3:DeleteObject"
        ]
        Resource = [
          aws_s3_bucket.website.arn,
          "${aws_s3_bucket.website.arn}/*"
        ]
      }
    ]
  })
}

# Create IAM user for frontend CI/CD
resource "aws_iam_user" "frontend_ci" {
  name = "${local.name_prefix}-frontend-ci"
  tags = local.common_tags
}

# Attach the policy to the user
resource "aws_iam_user_policy_attachment" "frontend_deployment" {
  user       = aws_iam_user.frontend_ci.name
  policy_arn = aws_iam_policy.frontend_deployment.arn
}

# Create access key for the IAM user
resource "aws_iam_access_key" "frontend_ci" {
  user = aws_iam_user.frontend_ci.name

  depends_on = [aws_iam_user.frontend_ci]
} 