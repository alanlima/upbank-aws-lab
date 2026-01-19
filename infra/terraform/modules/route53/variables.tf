variable "domain_name" {
  description = "The domain name for the Route53 zone"
  type        = string
}

variable "create_hosted_zone" {
  description = "Whether to create a hosted zone"
  type        = bool
  default     = true
}

variable "hosted_zone_id" {
  description = "The ID of an existing hosted zone (if not creating a new one)"
  type        = string
}

variable "records" {
  description = "A list of DNS records to create in the hosted zone"
  type = list(object({
    name    = string
    type    = string
    ttl     = number
    values = list(string)
    alias = object({
      name                   = string
      zone_id                = string
      evaluate_target_health = bool
    })
  }))
}

variable "tags" {
  description = "A map of tags to assign to the Route53 resources"
  type        = map(string)
  default     = {}
}