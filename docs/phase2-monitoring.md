# Phase 2 — Monitoring & Observability (Prometheus & Grafana)

## Objective

The goal of Phase 2 is to introduce **production-grade observability** into the platform by deploying **Prometheus and Grafana directly into the AWS EKS cluster**.

Monitoring is treated as a **first-class platform concern**, not an afterthought.
Before adding authentication, APIs, or CI/CD, the platform must be **observable, diagnosable, and debuggable**.

This phase mirrors how Kubernetes platforms are typically monitored in large organisations (including CBA).

---

## What Was Implemented

### Monitoring Stack (Deployed in AWS)

The following components were installed into EKS using **Terraform + Helm**:

* **kube-prometheus-stack**

  * Prometheus (metrics collection & storage)
  * Grafana (visualisation & dashboards)
  * Alertmanager (alerting foundation)
  * kube-state-metrics (Kubernetes desired vs actual state)
  * node-exporter (node-level metrics)

All components run **inside the cluster**, in a dedicated `monitoring` namespace.

---

### Infrastructure as Code

* Monitoring is defined **entirely in Terraform**
* Helm is invoked via the Terraform `helm_release` resource
* Baseline configuration is versioned in the repository
* The stack is **reproducible, idempotent, and teardown-safe**

This aligns monitoring with the same lifecycle as the rest of the platform.

---

### Access Model (Phase 2)

* Grafana and Prometheus are exposed as **ClusterIP services**
* Access is performed via `kubectl port-forward`
* No public exposure, DNS, or TLS is configured at this stage

This ensures:

* Safe defaults
* No unauthenticated public endpoints
* Faster iteration during early phases

---

### Observability Capabilities Gained

After Phase 2, the platform provides visibility into:

#### Cluster Health

* Node readiness
* Resource pressure (CPU, memory)
* Node-level metrics

#### Kubernetes State

* Desired vs actual replicas
* Pod restarts and crash loops
* Pending and failing workloads

#### Platform Debugging

* Clear distinction between:

  * platform issues
  * application issues
* Faster root-cause analysis during failures

---

### Key Learnings

* Kubernetes monitoring must be **deployed early**, not retrofitted
* Prometheus complements (not replaces) CloudWatch
* kube-state-metrics is critical for understanding *why* things break
* Dashboards dramatically reduce mean-time-to-understand (MTTU)
* Observability enables confident iteration in later phases

---

### Phase 2 Outcome

By the end of Phase 2:

* The EKS cluster is fully observable
* Metrics are collected continuously
* Grafana dashboards provide real-time visibility
* Platform failures are diagnosable without guesswork
* The foundation is ready for:

  * authentication
  * APIs
  * CI/CD
  * production hardening

---

### Why Phase 2 Comes Before Authentication and APIs

Introducing Cognito, AppSync, and backend services **without observability** would make failures opaque and difficult to debug.

Phase 2 ensures that:

* future failures have signals
* platform behaviour is measurable
* complexity is added on a stable, visible foundation

## Useful Commands

```bash
 # Expose the grafana dashboard locally
 kubectl port-forward -n monitoring svc/kube-prometheus-stack-grafana 3000:80

 # Expose the prometheus dashboard locally
 kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```
