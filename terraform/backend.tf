terraform {
  backend "s3" {
    bucket         = "awsplayground-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "awsplayground-terraform-locks"
    encrypt        = true
  }
} 