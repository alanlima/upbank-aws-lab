resource "aws_route53_zone" "root" {
  name = var.root_domain
  tags = local.tags
}

##################################################################
# Cognito User Pool Custom Domain with Route53 DNS Validation
##################################################################

# TODO: move duplicate code into a reusable module (cert creation, cert validation, zone records creation and etc)
# TODO: move the cognito / ui setup into application module.

resource "aws_acm_certificate" "cognito" {
  provider          = aws.use1 # Cognito hosted UI requires certs in us-east-1 for CloudFront
  domain_name       = local.auth_fqdn
  validation_method = "DNS"
}

resource "aws_route53_record" "cognito_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cognito.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = aws_route53_zone.root.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "cognito" {
  provider                = aws.use1
  certificate_arn         = aws_acm_certificate.cognito.arn
  validation_record_fqdns = [for r in aws_route53_record.cognito_cert_validation : r.fqdn]
}

resource "aws_cognito_user_pool_domain" "this" {
  domain          = local.auth_fqdn
  user_pool_id    = module.application.cognito_user_pool_id
  certificate_arn = aws_acm_certificate_validation.cognito.certificate_arn
}

resource "aws_route53_record" "cognito" {
  name    = aws_cognito_user_pool_domain.this.domain
  type    = "A"
  zone_id = aws_route53_zone.root.zone_id
  alias {
    name                   = aws_cognito_user_pool_domain.this.cloudfront_distribution
    zone_id                = aws_cognito_user_pool_domain.this.cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

##################################################################
# UI Custom Domain with Route53 DNS Validation
##################################################################
resource "aws_acm_certificate" "ui" {
  domain_name       = local.ui_fqdn
  validation_method = "DNS"
}

resource "aws_route53_record" "ui_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.ui.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = aws_route53_zone.root.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "ui" {
  certificate_arn         = aws_acm_certificate.ui.arn
  validation_record_fqdns = [for r in aws_route53_record.ui_cert_validation : r.fqdn]
}

# TODO: need to review the LB, as it depends on the k8s cluster being up

data "aws_lb" "ui_alb" {
  name = var.ui_alb_name
}

resource "aws_route53_record" "ui_alias" {
  zone_id = aws_route53_zone.root.zone_id
  name    = local.ui_fqdn
  type    = "A"

  alias {
    name                   = data.aws_lb.ui_alb.dns_name
    zone_id                = data.aws_lb.ui_alb.zone_id
    evaluate_target_health = true
  }
}

##################################################################
# AWS AppSync Custom Domain with Route53 DNS Validation
##################################################################

resource "aws_acm_certificate" "appsync" {
  provider          = aws.use1 # AppSync will use CloudFront which requires certs in us-east-1 
  domain_name       = local.api_fqdn
  validation_method = "DNS"
}

resource "aws_route53_record" "appsync_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.appsync.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = aws_route53_zone.root.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 300
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "appsync" {
  provider                = aws.use1
  certificate_arn         = aws_acm_certificate.appsync.arn
  validation_record_fqdns = [for r in aws_route53_record.appsync_cert_validation : r.fqdn]
}

resource "aws_appsync_domain_name" "appsync" {
  domain_name     = local.api_fqdn
  certificate_arn = aws_acm_certificate_validation.appsync.certificate_arn
}

resource "aws_appsync_domain_name_api_association" "assoc" {
  api_id      = module.application.appsync_api_id
  domain_name = aws_appsync_domain_name.appsync.domain_name
}


resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.root.zone_id
  name    = local.api_fqdn
  type    = "CNAME"
  ttl     = 300
  records = [
    aws_appsync_domain_name.appsync.appsync_domain_name
  ]
}