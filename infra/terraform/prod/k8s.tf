provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.this.token
}

provider "helm" {
  kubernetes = {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.this.token
  }
}

module "lb_controller_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts"
  version = "~> 6.3.0"

  name = "${local.cluster_name}-aws-lb-controller"

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:aws-load-balancer-controller"]
    }
  }
}

resource "aws_iam_policy" "aws_lb_controller" {
  name   = "${local.cluster_name}-AWSLoadBalancerControllerPolicy"
  policy = file("../policies/aws-lb-controller-iam-policy.json")
}

resource "aws_iam_role_policy_attachment" "aws_lb_controller_attach" {
  role       = module.lb_controller_irsa.name
  policy_arn = aws_iam_policy.aws_lb_controller.arn
}

resource "helm_release" "aws_load_balancer_controller" {
  name       = "aws-load-balancer-controller"
  namespace  = "kube-system"
  repository = "https://aws.github.io/eks-charts"
  chart      = "aws-load-balancer-controller"
  version    = "1.7.2"

  set = [
    {
      name  = "clusterName"
      value = module.eks.cluster_name
    },
    {
      name  = "serviceAccount.name"
      value = "aws-load-balancer-controller"
    },
    {
      name  = "vpcId",
      value = module.vpc.vpc_id
    },
    {
      name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
      value = module.lb_controller_irsa.arn
    },
    {
      name  = "region"
      value = var.aws_region
    }
  ]
}

resource "kubernetes_namespace_v1" "frontend" {
  metadata {
    name = "frontend"
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = var.app_name
    }
  }
  depends_on = [module.eks]
}

// TODO: improve this config map to use DNS route, the ALB address is not static
resource "kubernetes_config_map_v1" "name" {
  metadata {
    name      = "upbank-ui-runtime-config"
    namespace = kubernetes_namespace_v1.frontend.metadata[0].name
    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
      "app.kubernetes.io/part-of"    = var.app_name
    }
  }

  binary_data = {
    "runtime-config.json" = base64encode(jsonencode({
      "cognitoDomain" : module.application.cognito_domain_url,
      "clientId" : module.application.cognito_app_client_id,
      "appSyncUrl" : module.application.appsync_graphql_url,
      "region" : var.aws_region,
      "scopes" : "openid email profile",
      "logoutUri" : "https://upbank-ui-alb-1328495550.ap-southeast-2.elb.amazonaws.com/logout",
      "redirectUri" : "https://upbank-ui-alb-1328495550.ap-southeast-2.elb.amazonaws.com/callback"
    }))
  }

  depends_on = [module.eks]
}