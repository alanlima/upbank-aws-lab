variable "name_prefix" {
  description = "Short project prefix, e.g. upbank"
  type        = string
}

variable "environment" {
  description = "Deployment environment, e.g. prod, staging, dev"
  type        = string
}

variable "aws_region" {
  description = "AWS region for deployment, e.g. us-west-2"
  type        = string
  default     = "ap-southeast-2"
}

variable "tags" {
  description = "Tags applied to resources"
  type        = map(string)
  default     = {}
}

# ---- Cognito ---- #
variable "cognito_app_client_name" {
  description = "Name of the Cognito User Pool App Client"
  type        = string
  default     = "upbank-app-client"
}

variable "cognito_domain_prefix" {
  description = "Prefix for the Cognito User Pool domain"
  type        = string
  default     = ""
}

variable "callback_urls" {
  description = "Allowed callback URLs for Cognito app client"
  type        = list(string)
}

variable "logout_urls" {
  description = "Allowed logout URLs for Cognito app client"
  type        = list(string)
}

variable "oauth_scopes" {
  description = "OAuth scopes for the app client"
  type        = list(string)
  default     = ["openid", "email", "profile"]
}

# ---- DynamoDB ---- #
variable "dynamodb_billing_mode" {
  description = "Billing mode for the DynamoDB table"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.dynamodb_billing_mode)
    error_message = "dynamodb_billing_mode: Billing mode must be either PAY_PER_REQUEST or PROVISIONED"
  }
}