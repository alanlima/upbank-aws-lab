# 🧪 Up Bank AWS End-to-End Architecture Lab

## 1. Purpose of This Lab

This repository contains a **deliberately realistic, end-to-end AWS architecture lab** designed to explore how modern cloud applications are:

* **provisioned** | **secured** | **operated** | **observed** | **delivered**

using **production-grade AWS and Kubernetes patterns**.

The lab integrates with the **Up Bank public API** to introduce real external dependencies and security considerations, while intentionally avoiding shortcuts that hide operational complexity.

The focus is **not just building something that works**, but understanding:

* *why it works*
* *how it fails*
* *how to observe it*
* *how to operate it safely*

---

## 2. Business Context & Problem Statement

A fintech-style application needs to:

* Authenticate users securely
* Allow users to connect their Up Bank account using a personal access token
* Retrieve and display banking account information
* Expose APIs suitable for frontend consumption
* Run on a scalable, cloud-native platform
* Be diagnosable in production-like conditions
* Be reproducible, auditable, and cost-aware

---

## 3. Core Architectural Principles

This lab is guided by the following principles:

* **Infrastructure as Code first**
* **Managed services where possible**
* **No secrets in the frontend**
* **Authentication before authorization**
* **Observability is not optional**
* **Failures are learning opportunities**
* **Incremental realism over shortcuts**

---

## 4. High-Level Architecture Concept

The platform is composed of:

* **Frontend**
  React application hosted on Kubernetes (EKS)

* **Authentication**
  Amazon Cognito (OIDC / OAuth2)

* **API Layer**
  AWS AppSync (GraphQL)

* **Integration Layer**
  AWS Lambda (Up token vault and Up API integration)

* **Secrets Management**
  AWS Secrets Manager
  *(with a planned migration path to DynamoDB for scale and reporting)*

* **Compute Platform**
  Amazon EKS with managed node groups

* **Ingress & Networking**
  AWS Application Load Balancer via Kubernetes Ingress

* **Observability & Monitoring**

  * **Prometheus + Grafana** (primary Kubernetes & workload observability)
  * **CloudWatch** (AWS control plane & managed services)

* **Infrastructure as Code**
  Terraform with remote state in S3

---

## 5. Phased Implementation Plan

### Phase 1 – Infrastructure, Kubernetes & Baseline Observability (Completed)

**Primary Goal:**
Establish a **stable, observable Kubernetes platform on AWS** that can host applications and be debugged realistically.

---

### What Was Implemented

#### Infrastructure

* VPC with:

  * public subnets
  * private subnets
  * NAT Gateway for outbound access
* Amazon EKS control plane
* Managed EC2-based node group
* Required IAM roles and service-linked roles

#### Kubernetes Platform

* Core EKS addons:

  * VPC CNI
  * kube-proxy
  * CoreDNS
* AWS Load Balancer Controller (via Helm)
* Placeholder `nginx` Deployment
* Service + Ingress to expose workloads publicly
* Public access via **ALB DNS hostname** (no custom DNS)

#### Observability (Baseline)

* Kubernetes-native debugging using:

  * node conditions
  * pod lifecycle events
  * `kubectl describe`
* CloudWatch visibility into:

  * EKS control plane logs
  * AWS service interactions
* Validation that issues can be diagnosed **without SSH**

---

### Real Issues Encountered (Intentionally Valuable)

This phase surfaced **real EKS operational issues**, including:

* Node groups stuck in `CREATING`
* Nodes registering but remaining `NotReady`
* VPC CNI not initialized
* Missing addons and permissions causing silent failures

Important clarifications:

* **Instance size did not cause instability**
* **Private-only EKS endpoints can work correctly**
* Root causes were **missing steps and incomplete platform wiring**, not hardware limits

---

### Key Learnings from Phase 1

* EKS failures are often **networking or addon-related**
* Nodes can exist but still be unusable
* The AWS VPC CNI is a **hard dependency** for node readiness
* Observability is required to debug infrastructure failures
* A running cluster is not the same as a **healthy** cluster

---

### Outcome of Phase 1

By the end of Phase 1:

* Infrastructure is fully reproducible
* EKS control plane is reachable from local machine
* Nodes successfully join the cluster
* Kubernetes system components can be inspected
* Ingress dynamically provisions a public ALB
* Placeholder application is reachable
* Failures can be explained using signals, not guesswork

This establishes a **trustworthy platform baseline**.

---

## 6. Phase 2 – Monitoring & Observability (Prometheus + Grafana)

**Primary Goal:**
Introduce **production-style observability** aligned with enterprise Kubernetes environments (e.g. CBA).

---

### Why Prometheus + Grafana

* Matches real-world Kubernetes monitoring practices
* Kubernetes-native metrics model
* Clear separation between:

  * platform health
  * application health
* Complements (does not replace) AWS CloudWatch

---

### What Will Be Implemented

* `kube-prometheus-stack` via Helm
* Prometheus:

  * node-exporter
  * kube-state-metrics
  * workload metrics
* Grafana:

  * cluster health dashboards
  * node and pod resource dashboards
  * deployment health and restarts
* Optional alerting:

  * Node NotReady
  * Pod CrashLoopBackOff
  * Resource saturation
  * Deployment drift

---

### Monitoring Outcomes

After this phase, the platform can answer:

* *Is the cluster healthy?*
* *Is this an application issue or a platform issue?*
* *What changed before the failure?*
* *Which team/layer owns the problem?*

---

## 7. Phase 3 – Authentication (Cognito)

* Amazon Cognito User Pool
* OAuth2 / OIDC authentication
* Frontend login via Hosted UI
* JWT-based authorization for AppSync

---

## 8. Phase 4 – API Layer (GraphQL)

* AWS AppSync GraphQL API
* Schema aligned with Up Bank domain
* Lambda resolvers for REST → GraphQL translation
* Cognito-protected API access

---

## 9. Phase 5 – Secure Token Handling

* Lambda-based token vault
* AWS Secrets Manager for secure storage
* Tokens scoped per authenticated user
* Least-privilege IAM permissions
* Auditable access via CloudTrail

---

## 10. Phase 6 – Frontend Application

* React application
* User onboarding flow (connect Up Bank token)
* Account listing and details
* Containerized deployment to EKS

---

## 11. Phase 7 – CI/CD & Terraform State Management

**Primary Goal:**
Introduce **safe, repeatable delivery pipelines** with proper infrastructure state management.

---

### CI/CD Principles

* Infrastructure and application pipelines are separated
* Terraform state is **never stored locally**
* State locking prevents concurrent modifications
* Pipelines are environment-aware (even if only `prod` initially)

---

### Terraform State Strategy

Terraform state is managed using:

* **S3 bucket** for remote state storage
* **DynamoDB table** for state locking

Benefits:

* Safe concurrent executions
* Recoverable state
* Pipeline-friendly
* Production-grade pattern

---

### CI/CD Responsibilities

* Terraform:

  * `init` against S3 backend
  * `plan` on pull request
  * `apply` on controlled approval
* Kubernetes:

  * image build & push
  * manifest or Helm deployment
* Observability:

  * dashboards and alerts treated as code

---

## 12. Phase 8 – DNS, TLS & Production Hardening

* Route 53
* ACM certificates
* HTTPS for frontend and Grafana
* Optional WAF
* Auth-protected observability endpoints

---

## 13. Domains Explored in This Lab

* AWS Infrastructure & Networking
* Kubernetes (EKS) operations
* IAM & security boundaries
* Authentication & identity
* API architecture (GraphQL, BFF)
* Secrets management
* **Monitoring & observability**
* CI/CD and state management
* Failure analysis and debugging
* Platform engineering thinking

---

## 14. High-Level Folder Structure

This is the **recommended structure** for the repository:

```
upbank-aws-lab/
├── README.md
├── docs/
│   ├── architecture/
│   ├── decisions/              # ADRs (optional)
│   └── runbooks/
│
├── infra/
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── eks/
│   │   │   ├── iam/
│   │   │   ├── appsync/
│   │   │   ├── cognito/
│   │   │   └── monitoring/
│   │   └── prod/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       ├── outputs.tf
│   │       ├── backend.tf       # S3 + DynamoDB backend
│   │       └── providers.tf
│   │
│   └── k8s/
│       ├── base/
│       │   ├── nginx/
│       │   └── monitoring/
│       └── overlays/
│
├── services/
│   └── token-vault/
│       └── lambda/
│
├── app/
│   └── frontend/
│       └── react/
│
└── ci/
    ├── terraform/
    └── kubernetes/
```

---

## 15. Why This Lab Exists

This project is **not a tutorial** and **not a happy-path demo**.

It exists to:

* Surface real failure modes
* Practice diagnosing platform issues
* Build intuition around AWS and Kubernetes
* Develop architectural judgment

The outcome is not just a working system —
it is **operational understanding**.

---

If you want next, we can:

* lock in **Phase 2 (Prometheus/Grafana) implementation steps**
* generate **architecture diagrams** aligned with this document
* or turn this into a **portfolio-ready case study**






# upbank-aws-lab
Hands-on lab to explore some key AWS concepts

```bash
aws eks update-kubeconfig \
  --region ap-southeast-2 \
  --name upbank-lab-prod \
  --alias upbank-prod
```


# TODO
- After cluster initialized, it needs to add the current user into the cluster policy