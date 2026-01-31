# Workbook Notes — Route 53 + AppSync Custom Domain (UI + API split)

## 1) What we’re building (context)

You have an AppSync GraphQL API whose default endpoint looks like:

`https://<id>.appsync-api.ap-southeast-2.amazonaws.com/graphql`

That endpoint is functional, but not portfolio-friendly, and you can’t “DNS map” to `/graphql` directly (DNS maps hostnames, not URL paths). Also, if you CNAME your own hostname directly to the AWS endpoint, TLS won’t match your domain.

**Correct AWS solution:** AppSync Custom Domain + ACM certificate + Route 53 DNS.

### Desired final result

* **UI hostname** (you’ll point later to CloudFront/ALB/S3 website/etc):
  `https://upbank-lab.alanlima.cloud`
* **API hostname** (AppSync custom domain):
  `https://api.upbank-lab.alanlima.cloud/graphql`

---

## 2) Why Route 53 hosted zone exists (and what “delegation” means)

Route 53 hosts your DNS records, but the public internet will only ask Route 53 for them if your registrar delegates the domain to Route 53 **nameservers**.

### Key concept

* **Registrar** = where you bought the domain
* **DNS authority** = whoever the domain points nameservers to
* Route 53 becomes authoritative only after you update nameservers at the registrar.

### Terraform: create hosted zone + output name servers

```hcl
resource "aws_route53_zone" "root" {
  name = "alanlima.cloud"
}

output "set_these_nameservers_in_registrar" {
  value = aws_route53_zone.root.name_servers
}
```

**Operational step (not Terraform):** copy those NS values into Hostinger’s nameserver settings for `alanlima.cloud`.

---

## 3) Why AppSync custom domains require ACM in `us-east-1`

AppSync custom domains are implemented behind the scenes using **CloudFront**, and CloudFront requires ACM public certificates to be created in **us-east-1**.

So we use two AWS providers:

* `ap-southeast-2` for most infra / your AppSync API itself
* `us-east-1` only for the certificate that AppSync custom domain needs

---

## 4) Terraform module-style “single file” for AppSync custom domain

This creates:

* Hosted zone (optional; you can remove if you already created it elsewhere)
* ACM cert (us-east-1) for `api.upbank-lab.alanlima.cloud`
* DNS validation record in Route 53
* AppSync domain
* Domain association to your AppSync API
* Route 53 CNAME pointing `api.upbank-lab` to the CloudFront domain AppSync generates

> **Note:** This is intentionally “workbook clear”, not overly abstract.

### `main.tf`

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

############################################
# Providers
############################################

# AppSync region
provider "aws" {
  region = "ap-southeast-2"
}

# ACM for AppSync custom domain MUST be in us-east-1
provider "aws" {
  alias  = "use1"
  region = "us-east-1"
}

############################################
# Inputs
############################################

variable "root_domain" {
  type    = string
  default = "alanlima.cloud"
}

variable "ui_subdomain" {
  type    = string
  default = "upbank-lab"
}

variable "api_subdomain" {
  type    = string
  default = "api.upbank-lab"
}

variable "appsync_api_id" {
  type        = string
  description = "Existing AppSync GraphQL API ID"
}

locals {
  ui_fqdn  = "${var.ui_subdomain}.${var.root_domain}"       # upbank-lab.alanlima.cloud
  api_fqdn = "${var.api_subdomain}.${var.root_domain}"      # api.upbank-lab.alanlima.cloud
}

############################################
# Route 53 Hosted Zone
# If you already have a hosted zone, use data source instead.
############################################

# Option A: create hosted zone here
resource "aws_route53_zone" "root" {
  name = var.root_domain
}

# Option B: if hosted zone already exists, comment out the resource above
# and uncomment this data source:
# data "aws_route53_zone" "root" {
#   name         = var.root_domain
#   private_zone = false
# }

# Use whichever is active:
locals {
  zone_id = aws_route53_zone.root.zone_id
  # zone_id = data.aws_route53_zone.root.zone_id
}

output "nameservers_set_at_registrar" {
  description = "Set these NS records in Hostinger for alanlima.cloud (only if you created the hosted zone here)."
  value       = aws_route53_zone.root.name_servers
}

############################################
# ACM Certificate (us-east-1) for API domain
############################################

resource "aws_acm_certificate" "api_cert" {
  provider          = aws.use1
  domain_name       = local.api_fqdn
  validation_method = "DNS"
}

# Create the DNS validation record(s)
resource "aws_route53_record" "api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id  = local.zone_id
  name     = each.value.name
  type     = each.value.type
  ttl      = 60
  records  = [each.value.record]
}

# Wait until ACM is "Issued"
resource "aws_acm_certificate_validation" "api_cert" {
  provider                = aws.use1
  certificate_arn         = aws_acm_certificate.api_cert.arn
  validation_record_fqdns = [for r in aws_route53_record.api_cert_validation : r.fqdn]
}

############################################
# AppSync Custom Domain + Association
############################################

resource "aws_appsync_domain_name" "api_domain" {
  domain_name     = local.api_fqdn
  certificate_arn = aws_acm_certificate_validation.api_cert.certificate_arn
}

resource "aws_appsync_domain_name_api_association" "api_assoc" {
  api_id      = var.appsync_api_id
  domain_name = aws_appsync_domain_name.api_domain.domain_name
}

############################################
# DNS: api.upbank-lab.alanlima.cloud -> AppSync CloudFront name
############################################

resource "aws_route53_record" "api_cname" {
  zone_id = local.zone_id
  name    = local.api_fqdn
  type    = "CNAME"
  ttl     = 300
  records = [aws_appsync_domain_name.api_domain.appsync_domain_name]
}

############################################
# Outputs
############################################

output "api_graphql_url" {
  value = "https://${local.api_fqdn}/graphql"
}

output "api_realtime_url" {
  value = "wss://${local.api_fqdn}/graphql/realtime"
}

output "ui_fqdn_note" {
  description = "UI hostname reserved. Point this later to CloudFront/ALB/etc."
  value       = local.ui_fqdn
}
```

---

## 5) UI hostname notes (why it’s not in the code above)

You said `upbank-lab` is the UI url. That likely points to one of these later:

* CloudFront distribution (S3 static site / EKS ingress / ALB)
* ALB (if you serve UI from Nginx/Ingress)
* S3 website (less common now, but still possible)

So for now, the workbook purpose is:

* Reserve the hostname
* Build the API custom domain correctly

**Later**, you’ll add a Route 53 record for `upbank-lab.alanlima.cloud` to whatever hosts your UI.

If you want to reserve it today without knowing the target, you can add a placeholder TXT record (optional):

```hcl
resource "aws_route53_record" "ui_placeholder" {
  zone_id = local.zone_id
  name    = local.ui_fqdn
  type    = "TXT"
  ttl     = 300
  records = ["reserved-for-ui"]
}
```

---

## 6) What “success” looks like (verification checklist)

* `dig NS alanlima.cloud` returns Route 53 nameservers (means delegation is correct)
* `dig CNAME api.upbank-lab.alanlima.cloud` returns an AppSync/CloudFront hostname
* Hitting:

  * `https://api.upbank-lab.alanlima.cloud/graphql` returns GraphQL responses (or auth error, which is still good because it means routing works)
* ACM certificate status is **Issued** in us-east-1

---

## 7) Practical naming recommendation

* **UI:** `upbank-lab.alanlima.cloud`
* **API:** `api.upbank-lab.alanlima.cloud`

That’s a very standard “frontend + api” split, and it looks professional in a portfolio.
