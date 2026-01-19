variable "namespace" {
  description = "The Kubernetes namespace to deploy monitoring resources into"
  type        = string
  default     = "monitoring"
}

variable "prometheus_chart_version" {
  description = "The version of the Prometheus Helm chart to deploy"
  type        = string
  default     = "81.0.0"
}

variable "default_labels" {
  description = "Default labels to apply to all monitoring resources"
  type        = map(string)
  default     = {}
}

variable "project_name" {
  description = "The name of the project to associate with monitoring resources"
  type        = string
}