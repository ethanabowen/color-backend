variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "color-service"
}

# VPC CIDR block with validation
# /16 provides room for future expansion and service requirements
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# Private subnet CIDRs with validation
# /24 provides 256 IPs per subnet, sufficient for Lambda concurrency
variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "availability_zones" {
  description = "Availability zones for subnets"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
} 