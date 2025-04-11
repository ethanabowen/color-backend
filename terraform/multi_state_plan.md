# Multi-State Migration Plan for Color Service Infrastructure

Note: before running any terraform on the cli, prepend AWS_PROFILE=ethan_hobby

## Current State
Single Terraform state managing:
- Network Infrastructure (planned)
- Application Resources (Lambda, API Gateway, DynamoDB)
- CI/CD Pipeline
- Frontend Infrastructure (S3, CloudFront)

## Target State
Three separate Terraform states:
1. Networking Infrastructure
2. Application Infrastructure
3. CI/CD Infrastructure

## Migration Steps

### 1. Preparation Phase

#### 1.1 Create New Directory Structure
```bash
mkdir -p terraform/{networking,application,cicd}
```

#### 1.2 Create State Storage Infrastructure
```hcl
# Create a new terraform configuration for state management
resource "aws_s3_bucket" "terraform_state" {
  bucket = "color-service-terraform-state"
  
  versioning {
    enabled = true
  }
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "color-service-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### 2. State Separation

#### 2.1 Networking State Setup
1. Create base files:
   - `networking/main.tf`
   - `networking/variables.tf`
   - `networking/outputs.tf`
   - `networking/backend.tf`

2. Move networking resources:
   - VPC configuration from networking plan
   - Security Groups
   - VPC Endpoints
   - Associated IAM roles

3. Configure backend:
```hcl
terraform {
  backend "s3" {
    bucket         = "color-service-terraform-state"
    key            = "color-service/networking/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "color-service-terraform-locks"
    encrypt        = true
  }
}
```

#### 2.2 Application State Setup
1. Create base files:
   - `application/main.tf`
   - `application/variables.tf`
   - `application/outputs.tf`
   - `application/backend.tf`

2. Move application resources:
   - Lambda functions (`lambda.tf`)
   - API Gateway (`api_gateway.tf`)
   - DynamoDB tables
   - S3 buckets (`s3.tf`)
   - CloudFront distribution (`cloudfront.tf`)
   - Website configuration (`website.tf`)
   - Application-specific IAM roles

3. Configure backend:
```hcl
terraform {
  backend "s3" {
    bucket         = "color-service-terraform-state"
    key            = "color-service/application/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "color-service-terraform-locks"
    encrypt        = true
  }
}
```

#### 2.3 CI/CD State Setup
1. Create base files:
   - `cicd/main.tf`
   - `cicd/variables.tf`
   - `cicd/outputs.tf`
   - `cicd/backend.tf`

2. Move CI/CD resources:
   - CI/CD configuration (`cicd.tf`)
   - CI/CD-specific IAM roles

3. Configure backend:
```hcl
terraform {
  backend "s3" {
    bucket         = "color-service-terraform-state"
    key            = "color-service/cicd/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "color-service-terraform-locks"
    encrypt        = true
  }
}
```

### 3. State Data Sharing

#### 3.1 Networking Outputs
```hcl
# networking/outputs.tf
output "vpc_id" {
  value = aws_vpc.main.id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "lambda_security_group_id" {
  value = aws_security_group.lambda.id
}

output "vpc_endpoint_security_group_id" {
  value = aws_security_group.vpc_endpoint.id
}
```

#### 3.2 Application State Data Sources
```hcl
# application/data.tf
data "terraform_remote_state" "networking" {
  backend = "s3"
  config = {
    bucket = "color-service-terraform-state"
    key    = "color-service/networking/terraform.tfstate"
    region = "us-east-1"
  }
}
```

#### 3.3 CI/CD State Data Sources
```hcl
# cicd/data.tf
data "terraform_remote_state" "application" {
  backend = "s3"
  config = {
    bucket = "color-service-terraform-state"
    key    = "color-service/application/terraform.tfstate"
    region = "us-east-1"
  }
}
```

### 4. Migration Execution

1. **Backup Current State**
   ```bash
   terraform state pull > terraform.backup.tfstate
   ```

2. **Create New State Infrastructure**
   - Apply state storage configuration
   - Verify S3 bucket and DynamoDB table creation

3. **Migrate Networking State**
   ```bash
   # For each networking resource
   terraform state mv 'resource_type.name' 'resource_type.new_name'
   ```

4. **Migrate Application State**
   ```bash
   # For each application resource
   terraform state mv 'resource_type.name' 'resource_type.new_name'
   ```

5. **Migrate CI/CD State**
   ```bash
   # For each CI/CD resource
   terraform state mv 'resource_type.name' 'resource_type.new_name'
   ```

### 5. Validation and Testing

1. **Verify State Files**
   - Check S3 bucket for new state files
   - Verify state file contents

2. **Test Apply Operations**
   ```bash
   cd terraform/networking
   terraform init
   terraform plan
   
   cd ../application
   terraform init
   terraform plan
   
   cd ../cicd
   terraform init
   terraform plan
   ```

3. **Verify Resource Dependencies**
   - Ensure networking outputs are accessible
   - Verify application resources can access network resources
   - Confirm CI/CD can access application resources

### 6. Cleanup

1. Remove old Terraform files from root directory
2. Update documentation and README files
3. Update CI/CD pipelines to handle multi-state configuration
4. Archive old state backup

### 7. Best Practices for Future Management

1. **Change Management**
   - Always apply networking changes first
   - Test application changes in isolation
   - Maintain separate access controls for each state

2. **State Management**
   - Regular state backups
   - Use workspaces for environment separation
   - Monitor state file size and lock duration

3. **Documentation**
   - Maintain README in each state directory
   - Document dependencies between states
   - Keep variables and outputs well-documented

4. **Security**
   - Implement strict IAM policies for state access
   - Enable audit logging for state operations
   - Regular security reviews of exposed outputs 