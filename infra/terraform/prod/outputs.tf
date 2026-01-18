output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = module.eks.cluster_version
}

output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

output "node_group_names" {
  description = "EKS managed node group names"
  value       = [for ng in module.eks.eks_managed_node_groups : ng.node_group_id]
}

output "node_security_group_id" {
  description = "Security group ID for EKS nodes"
  value       = module.eks.node_security_group_id
}

output "lb_controller_role_arn" {
  description = "IAM role ARN for AWS Load Balancer Controller"
  value       = module.lb_controller_irsa.arn
}

output "lb_controller_role_name" {
  description = "IAM role name for AWS Load Balancer Controller"
  value       = module.lb_controller_irsa.name
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN for IRSA"
  value       = module.eks.oidc_provider_arn
}

output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name} --alias upbank-${var.environment}"
}

output "appsync_graphql_url" {
  value = module.application.appsync_graphql_url
}

output "cognito_domain_url" {
  value = module.application.cognito_domain_url
}

output "cognito_app_client_id" {
  value = module.application.cognito_app_client_id
}

output "acm_self_signed_certificate_arn" {
  value = aws_acm_certificate.imported.arn
}