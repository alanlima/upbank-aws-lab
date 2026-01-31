variable "aws_region" {
  description = "AWS region where all resources will be provisioned (e.g., ap-southeast-2)"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "Deployment environment name, such as prod, staging, or dev. Used for resource naming and tagging."
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Unique name of the application. Used for resource names, tags, and DNS records."
  type        = string
  default     = "upbank-lab"
}

variable "vpc_cidr" {
  description = "CIDR block for the primary VPC (e.g., 10.40.0.0/16). Determines the IP address range for the network."
  type        = string
  default     = "10.40.0.0/16"
}

variable "kubernetes_version" {
  description = "Kubernetes version to use for the EKS cluster (e.g., 1.35). Controls cluster and node compatibility."
  type        = string
  default     = "1.35" # upgrade to 1.35
}

variable "node_instance_types" {
  description = "List of EC2 instance types for EKS worker nodes (e.g., [\"t3.medium\"]). Determines compute resources for the cluster."
  type        = list(string)
  default     = ["t3.medium"]
}

variable "eks_admin_user_name" {
  description = "IAM user name to be granted administrative access to the EKS cluster. Used for initial cluster access setup."
  type        = string
}

variable "aws_profile" {
  description = "Name of the AWS CLI profile to use for authentication. Leave empty for CI/CD or to use the default credentials chain."
  type        = string
  default     = ""
}

variable "owner" {
  description = "Owner or responsible team for the infrastructure. Used for tagging and resource tracking."
  type        = string
  default     = "awslab-team"
}

variable "root_domain" {
  description = "Root DNS domain to register in Route53 (e.g., alanlima.cloud). Used for application and API endpoints."
  type        = string
}

variable "ui_alb_name" {
  description = "Name of the Application Load Balancer (ALB) for the UI service. Used for resource naming and identification."
  type        = string
  default     = "upbank-ui-alb"
}