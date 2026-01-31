locals {
  tags = {
    Environment        = var.environment
    Application        = var.app_name
    ManagedBy          = "terraform"
    DataClassification = "sensitive"
    Owner              = var.owner
  }

  cluster_name = "${var.app_name}-${var.environment}"

  api_fqdn = "api.${var.app_name}.${var.root_domain}"
  ui_fqdn  = "${var.app_name}.${var.root_domain}"
}

data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 6.6.0"

  name = "${local.cluster_name}-vpc"
  cidr = var.vpc_cidr
  tags = local.tags

  azs = slice(data.aws_availability_zones.available.names, 0, 2)
  private_subnets = [
    cidrsubnet(var.vpc_cidr, 8, 1),
    cidrsubnet(var.vpc_cidr, 8, 2)
  ]
  public_subnets = [
    cidrsubnet(var.vpc_cidr, 8, 101),
    cidrsubnet(var.vpc_cidr, 8, 102)
  ]

  enable_nat_gateway = true
  single_nat_gateway = true

  public_subnet_tags = merge(
    local.tags,
    {
      "kubernetes.io/role/elb"                      = "1",
      "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    }
  )

  private_subnet_tags = merge(
    local.tags,
    {
      "kubernetes.io/role/internal-elb"             = "1",
      "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    }
  )
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.14.0"

  name               = local.cluster_name
  kubernetes_version = var.kubernetes_version
  tags               = local.tags

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # INFO: lab purpose - allow access to cluster from outside VPC (e.g., via kubectl from local)
  endpoint_public_access = true

  dataplane_wait_duration = "60s"

  enable_irsa = true

  # Create addons DURING cluster creation, not after
  addons = {
    vpc-cni = {
      # addon_version = "v1.21.1-eksbuild.1" 
      addon_version = "v1.21.1-eksbuild.3"
      # Only VPC CNI can be created before nodes are up
      before_compute              = true
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
    kube-proxy = {
      addon_version               = "v1.35.0-eksbuild.2"
      before_compute              = false
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
    coredns = {
      # addon_version               = "v1.12.4-eksbuild.1"
      addon_version               = "v1.13.1-eksbuild.1"
      before_compute              = false
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
  }

  eks_managed_node_groups = {
    default = {
      instance_types = var.node_instance_types
      min_size       = 1
      max_size       = 3
    }
  }
}

# TODO: the access entry is required to give permission for the cluster, but it needs to do via role (ideally)
data "aws_iam_user" "eks_user" {
  user_name = var.eks_admin_user_name
}

resource "aws_eks_access_entry" "this" {
  cluster_name  = module.eks.cluster_name
  principal_arn = data.aws_iam_user.eks_user.arn
  type          = "STANDARD"
  depends_on    = [module.eks]
}

resource "aws_eks_access_policy_association" "admin" {
  cluster_name  = module.eks.cluster_name
  principal_arn = aws_eks_access_entry.this.principal_arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }
}

# Wait for IAM permissions to propagate before creating load balancer controller
resource "time_sleep" "wait_for_iam_propagation" {
  depends_on      = [aws_eks_access_policy_association.admin]
  create_duration = "45s"
}

# data "aws_eks_cluster" "this" {
#   name = module.eks.cluster_name
# }

data "aws_eks_cluster_auth" "this" {
  name = module.eks.cluster_name
}

# --------------------------
# Monitoring Module
# --------------------------
module "monitoring" {
  source = "../modules/monitoring"

  project_name = var.app_name
  namespace    = "monitoring"

  providers = {
    kubernetes = kubernetes
    helm       = helm
  }

  # Ensure monitoring is created after EKS and destroyed before EKS
  depends_on = [module.eks]
}

# --------------------------
# Application Module
# --------------------------
module "application" {
  source = "../modules/app_upbank"

  name_prefix = "upbank"
  environment = var.environment
  aws_region  = var.aws_region

  cognito_domain_prefix = "upbank-${var.environment}"

  callback_urls = [
    "https://localhost:5173/callback",
    "https://${local.ui_fqdn}/callback"
  ]

  logout_urls = [
    "https://localhost:5173/logout",
    "https://${local.ui_fqdn}/logout"
  ]

  tags = local.tags
}

# NOTE: This null_resource is intended as a workaround to influence destroy order, 
# ensuring that the application and monitoring modules are destroyed before this resource. 
# However, it does NOT guarantee that other resources (such as Kubernetes resources created outside these modules) will be destroyed first. 
# The depends_on only affects this resource's own destroy timing, not the destroy order of other resources. 
# Consider managing destroy order explicitly on the resources that require it.
resource "null_resource" "destroy_order" {
  provisioner "local-exec" {
    when    = destroy
    command = "echo 'Application resources will be destroyed first'"
  }

  depends_on = [
    module.application,
    module.monitoring
  ]
}