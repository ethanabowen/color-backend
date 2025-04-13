# Networking Plan for Color Service Serverless Architecture

## Overview
This document outlines the networking infrastructure plan for the Color Service application using AWS VPC and related networking components. The plan focuses on security, scalability, and AWS best practices for serverless architectures.

## CIDR Block Planning
- VPC CIDR: `10.0.0.0/20` (4,096 IP addresses)
  - Reasoning: 
    - Application requirements indicate max 1000 users and 150 concurrent lambdas
    - Each Lambda function requires an ENI (Elastic Network Interface) with a private IP
    - Adding buffer for future growth (4x current needs)
    - Small enough to avoid wastage of IP space
    - Allows for 16 subnets (/24 each) if needed

## Subnet Structure
We will only need private subnets for this architecture. Here's why:
- API Gateway can be deployed as a private endpoint using VPC endpoints (no public subnet needed)
- Lambda functions only need private subnet access
- DynamoDB access is through VPC endpoints (no public subnet needed)
- CloudFront distribution handles public access to the website

### Private Subnet CIDR Allocation
- Private Subnet AZ-1: `10.0.1.0/24` (256 IPs)
- Private Subnet AZ-2: `10.0.2.0/24` (256 IPs)
- Private Subnet AZ-3: `10.0.3.0/24` (256 IPs)

## Implementation Steps

### 1. VPC Creation
```hcl
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/20"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "${var.project_name}-vpc-${var.environment}"
    Environment = var.environment
  }
}
```

### 2. Private Subnet Creation
```hcl
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name        = "${var.project_name}-private-${count.index + 1}-${var.environment}"
    Environment = var.environment
  }
}
```

### 3. VPC Endpoints
```hcl
# For DynamoDB access
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id       = aws_vpc.main.id
  service_name = "com.amazonaws.${data.aws_region.current.name}.dynamodb"
  
  tags = {
    Name        = "${var.project_name}-dynamodb-endpoint-${var.environment}"
    Environment = var.environment
  }
}

# For API Gateway access
resource "aws_vpc_endpoint" "execute_api" {
  vpc_id             = aws_vpc.main.id
  service_name       = "com.amazonaws.${data.aws_region.current.name}.execute-api"
  vpc_endpoint_type  = "Interface"
  subnet_ids         = aws_subnet.private[*].id
  security_group_ids = [aws_security_group.vpc_endpoint.id]
  
  private_dns_enabled = true
  
  tags = {
    Name        = "${var.project_name}-execute-api-endpoint-${var.environment}"
    Environment = var.environment
  }
}
```

### 4. Security Groups
```hcl
resource "aws_security_group" "lambda" {
  name_prefix = "${var.project_name}-lambda-${var.environment}"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-lambda-sg-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_security_group" "vpc_endpoint" {
  name_prefix = "${var.project_name}-vpce-${var.environment}"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  tags = {
    Name        = "${var.project_name}-vpce-sg-${var.environment}"
    Environment = var.environment
  }
}
```

### 5. Lambda Configuration Updates
Update the Lambda function configuration to use VPC:
```hcl
resource "aws_lambda_function" "color_service" {
  # ... existing configuration ...

  vpc_config {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }
}
```

### 6. Additional IAM Permissions
Add VPC execution permissions to Lambda role:
```hcl
resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
```

## Network Flow
1. Client Request → CloudFront → API Gateway VPC Endpoint
2. API Gateway VPC Endpoint → Lambda (in Private Subnet)
3. Lambda → DynamoDB VPC Endpoint → DynamoDB Service

## Security Considerations
- No public subnets needed, reducing attack surface
- All traffic between services stays within AWS network
- VPC endpoints provide secure access to AWS services
- Security groups control access between components
- Lambda functions have no direct internet access (additional security)

## Monitoring Recommendations
1. Enable VPC Flow Logs
2. Monitor VPC endpoint metrics
3. Set up CloudWatch alarms for network metrics
4. Enable AWS Config rules for network compliance

## Cost Considerations
- VPC endpoints have hourly charges
- NAT Gateways not needed (cost saving)
- Private subnets reduce data transfer costs 