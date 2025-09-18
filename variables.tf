variable "repository_url" {
  description = "GitHub repository URL for Amplify app"
  default     = "https://github.com/gregoire-cousin-idnow/webcore-idnow-configuration"
}

variable "personal_access_token" {
  description = "Self-hosted GH personal access token for Amplify to pull the code"
}

variable "s3_bucket_name" {
  description = "S3 bucket name for storing configuration files"
  type        = string
  default     = "cms-config-bucket-v1"
}

variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "eu-west-3"
}

variable "project_name" {
  description = "Project name for resources"
  type        = string
  default     = "cms"
}

variable "cms_suffix" {
  description = "Suffix for resource names"
  type        = string
  default     = "v1"
}

variable "org_cors_allow_headers" {
  description = "allowed headers for cors configuration"
  type        = list(string)
  default     = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
}

variable "org_cors_allow_methods" {
  description = "allowed methods for cors configuration"
  type        = list(string)
  default     = ["*"]
}

variable "org_cors_allow_origins" {
  description = "allowed origins for cors configuration"
  type        = list(string)
  default     = ["*"]
}

variable "secret_key" {
  description = "jwt secret key"
  type        = string
  default     = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}

variable "admin_key" {
  description = "admin key"
  type        = string
  default     = "1234"
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for the custom domain"
  type        = string
}
