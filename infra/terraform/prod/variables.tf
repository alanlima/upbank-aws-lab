variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "The deployment environment (e.g., prod, staging, dev)"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "The name of the application"
  type        = string
  default     = "upbank-lab"
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "10.40.0.0/16"
}

variable "kubernetes_version" {
  description = "The Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.35" # upgrade to 1.35
}

variable "node_instance_types" {
  description = "The instance types for the EKS worker nodes"
  type        = list(string)
  default = ["t3.medium"]
}

variable "eks_admin_user_name" {
  type        = string
  description = "The IAM user name to be granted admin access to the EKS cluster"
}

variable "aws_profile" {
  description = "AWS profile to use (leave empty for CI/CD or default credentials chain)"
  type        = string
  default     = ""
}

variable "owner" {
  description = "The owner of the infrastructure"
  type        = string
  default     = "awslab-team"
}

variable "root_domain" {
  description = "root access domain to register in route53 done"
  type = string
}