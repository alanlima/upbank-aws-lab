terraform {
  required_providers {
    kubernetes = {
        source = "hashicorp/kubernetes"
        version = "~> 3.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 3.1"
    }
  }
}

locals {
  labels = merge({
    "app.kubernetes.io/managed-by" = "terraform"
    "app.kubernetes.io/part-of"  = var.project_name
  }, var.default_labels)
}

resource "kubernetes_namespace_v1" "this" {
  metadata {
    name = var.namespace
    labels = local.labels
  }
}

resource "helm_release" "prometheus" {
  name = "kube-prometheus-stack"
  namespace = kubernetes_namespace_v1.this.metadata[0].name
  repository = "https://prometheus-community.github.io/helm-charts"
  chart = "kube-prometheus-stack"
  version = var.prometheus_chart_version

  max_history = 5

  wait = true
  timeout = 1200

  values = [
    <<-YAML
    grafana:
      enabled: true
      adminPassword: admin
      service:
        type: ClusterIP
      defaultDashboardsEnabled: true

    prometheus:
      prometheusSpec:
        retention: 7d
        serviceMonitorSelectorNilUsesHelmValues: false
        podMonitorSelectorNilUsesHelmValues: false

    alertmanager:
      enabled: true

    kubeStateMetrics:
      enabled: true

    nodeExporter:
      enabled: true
    YAML
  ]
}