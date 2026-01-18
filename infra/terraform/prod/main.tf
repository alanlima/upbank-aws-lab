locals {
  tags = {
   Environment = var.environment
   Application = var.app_name
   ManagedBy   = "Terraform"
   DataClassification = "sensitive"
  }

  cluster_name = "${var.app_name}-${var.environment}"
}

data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
    source = "terraform-aws-modules/vpc/aws"
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
            "kubernetes.io/role/elb" = "1",
            "kubernetes.io/cluster/${local.cluster_name}" = "shared"
        }
    )

    private_subnet_tags = merge(
        local.tags,
        { 
            "kubernetes.io/role/internal-elb" = "1",
            "kubernetes.io/cluster/${local.cluster_name}" = "shared"
        }
    )
}

module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 21.14.0"

  name = local.cluster_name
  kubernetes_version = var.kubernetes_version
  tags = local.tags

  vpc_id = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # INFO: required to allow access to cluster from outside VPC (e.g., via kubectl from local)
  endpoint_public_access = true

  dataplane_wait_duration = "60s"

  enable_irsa = true

  # Create addons DURING cluster creation, not after
  addons = {
    vpc-cni = {
      addon_version     = "v1.21.1-eksbuild.1"
      # Only VPC CNI can be created before nodes are up
      before_compute = true
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
    kube-proxy = {
      addon_version     = "v1.34.1-eksbuild.2"
      before_compute = true # TODO: consider this needs to be set as false to be created once the nodes is up
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
    coredns = {
      addon_version     = "v1.12.4-eksbuild.1"
      before_compute = true # TODO: consider this needs to be set as false to be created once the nodes is up
      resolve_conflicts_on_create = "OVERWRITE"
      resolve_conflicts_on_update = "OVERWRITE"
    }
  }

  eks_managed_node_groups = {
    default = {
        instance_types = var.node_instance_types
        min_size = 1
        max_size = 3
        desired_capacity = 2
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
  depends_on = [aws_eks_access_policy_association.admin]
  create_duration = "30s"
}

data "aws_eks_cluster" "this" {
    name = module.eks.cluster_name
    depends_on = [module.eks]
}

data "aws_eks_cluster_auth" "this" {
  name = module.eks.cluster_name
  depends_on = [module.eks]
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.this.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.this.token
}

provider "helm" {
  kubernetes = {
    host                   = data.aws_eks_cluster.this.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.this.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.this.token
  }
}

module "lb_controller_irsa" {
    source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts"
    version = "~> 6.3.0"

    name = "${local.cluster_name}-aws-lb-controller"

    oidc_providers = {
        main = {
            provider_arn = module.eks.oidc_provider_arn
            namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
        }
    }
}

resource "aws_iam_policy" "aws_lb_controller" {
  name = "${local.cluster_name}-AWSLoadBalancerControllerPolicy"
  policy = file("../policies/aws-lb-controller-iam-policy.json")
}

resource "aws_iam_role_policy_attachment" "aws_lb_controller_attach" {
  role = module.lb_controller_irsa.name
  policy_arn = aws_iam_policy.aws_lb_controller.arn
}

resource "helm_release" "aws_load_balancer_controller" {
    name       = "aws-load-balancer-controller"
    namespace = "kube-system"
    repository = "https://aws.github.io/eks-charts"
    chart = "aws-load-balancer-controller"
    version = "1.7.2"

    set = [
        {
            name = "clusterName"
            value = module.eks.cluster_name
        },
        {
            name = "serviceAccount.name"
            value = "aws-load-balancer-controller"
        },
        {
            name = "vpcId",
            value = module.vpc.vpc_id
        },
        {
            name = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
            value = module.lb_controller_irsa.arn
        },
        {
            name = "region"
            value = var.aws_region
        }
    ]
}

resource "kubernetes_namespace_v1" "frontend" {
  metadata {
    name = "frontend"
    labels = {
        ManagedBy = "Terraform"
    }
  }
  depends_on = [ module.eks ]
}