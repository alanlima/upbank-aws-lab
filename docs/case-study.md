# Staff Engineer Case Study

## Designing a Serverless GraphQL Integration Platform on AWS

### Scope

End-to-end system design, security model, cloud-native integration, Kubernetes platform decisions, cost and scalability trade-offs.

---

## Executive Summary (Staff-Level Framing)

This project demonstrates how to design a **production-aligned, cloud-native architecture** using AWS managed services to solve authentication, API orchestration, and secure third-party integration — **without introducing unnecessary backend compute**.

The system integrates a real external banking API while maintaining strong security boundaries, predictable cost behavior, and a clear path for future evolution.

The design choices intentionally favor **operational simplicity, scalability, and correctness** over premature complexity.

---

## Architectural Overview

**Key components**

* **Amazon Cognito** — identity and authentication
* **AWS AppSync** — GraphQL API and orchestration layer
* **Amazon DynamoDB** — user-scoped token persistence
* **Amazon EKS** — frontend-only workload hosting
* **Application Load Balancer** — public ingress
* **External REST API** — Up Bank public API

**Boundary clarity**

* Only the frontend runs inside the VPC (EKS)
* AppSync, DynamoDB, and Cognito are regional managed services
* Security is enforced primarily through **identity (IAM/JWT)** rather than network placement

---

# AWS Well-Architected Pillar Mapping

---

## 1. Security Pillar

### Design Choices

* Authentication delegated entirely to **Amazon Cognito**
* OAuth2 Authorization Code Flow with PKCE
* No credentials handled by application code
* JWT validation enforced at the AppSync boundary
* External API tokens stored **server-side only**
* Tokens never exposed to the browser

### Rationale

Security controls are identity-first:

* who you are (JWT/IAM) matters more than where you run
* aligns with AWS-managed service security posture

### Trade-offs

* Initial token storage is plain text (with AWS-managed encryption)
* Accepted temporarily to prioritize correctness and flow validation

### Planned Hardening

* Application-level encryption using KMS
* Token Vault Lambda to reduce AppSync blast radius

**Staff-level takeaway**

> Security was designed as a layered system that evolves — not a single control applied everywhere.

---

## 2. Reliability Pillar

### Design Choices

* Fully managed backend services (Cognito, AppSync, DynamoDB)
* No backend servers to scale or patch
* Stateless API layer
* Horizontal scaling by default

### Rationale

* Eliminates single points of failure
* AWS services handle availability and retries
* Reduces operational burden

### Failure Handling

* External API failures are isolated to AppSync resolvers
* Frontend remains available even if backend data is degraded

### Future Enhancements

* Retry/backoff strategies for external API calls
* Circuit breaker patterns via token broker

**Staff-level takeaway**

> Reliability is achieved by service selection and isolation, not by over-engineering application logic.

---

## 3. Performance Efficiency Pillar

### Design Choices

* AppSync pipeline resolvers eliminate unnecessary compute hops
* Direct DynamoDB access without Lambda overhead
* HTTP data source avoids cold starts
* Frontend served as static assets via Nginx + ALB

### Rationale

* Lower latency paths
* Reduced request fan-out
* Predictable performance under load

### Trade-offs

* AppSync JS runtime has limitations compared to Node.js
* Accepted in exchange for reduced infrastructure complexity

**Staff-level takeaway**

> Performance gains came from removing components, not adding them.

---

## 4. Cost Optimization Pillar

### Design Choices

* DynamoDB over Secrets Manager for token storage
* Serverless backend with consumption-based pricing
* No always-on backend services
* Kubernetes used only where it adds value (frontend)

### Rationale

* Tokens are application data, not secrets infrastructure
* DynamoDB scales cost-linearly with usage
* Avoids idle compute costs

### Cost Awareness

* Design considers future growth, not just lab scale
* Every managed service choice includes a cost trade-off analysis

**Staff-level takeaway**

> Cost was treated as a design constraint, not an afterthought.

---

## 5. Operational Excellence Pillar

### Design Choices

* Clear separation of responsibilities:

  * frontend delivery
  * identity
  * API orchestration
  * data persistence
* Incremental phase-based evolution
* Build metadata surfaced in UI and Kubernetes annotations
* Reproducible infrastructure via Terraform

### Lessons Learned

* AppSync has runtime-specific constraints
* SPA routing must be handled explicitly at the web server layer
* Kubernetes ownership boundaries must be defined early

### Future Improvements

* GitOps for Kubernetes reconciliation
* Enhanced observability across layers
* Structured error reporting and tracing

**Staff-level takeaway**

> The system was designed to be understood, operated, and evolved — not just deployed.

---

## Kubernetes Strategy (Staff Perspective)

Kubernetes is used **deliberately and minimally**:

* Frontend hosting only
* No backend coupling
* Clear ingress and rollout ownership

This avoids:

* Terraform/Kubernetes state coupling
* backend over-complexity
* unnecessary operational risk

---

## UI as an Operational Tool

The frontend is not just a demo UI:

* Displays authentication state
* Surfaces backend data
* Exposes build metadata (commit hash, build time)

This improves:

* traceability
* debugging
* operational confidence

---

## Why This Case Study Is Staff-Level

This project demonstrates:

* architectural trade-off analysis
* service boundary discipline
* security-first thinking
* operational pragmatism
* systems designed for evolution
* decisions justified with cost, reliability, and scale in mind

It reflects how **real systems are designed, defended, and iterated** at Staff Engineer level.

---

## Interview Closing Statement (Strong)

> *“I designed this system to minimize operational overhead while maintaining strong security boundaries, using managed AWS services wherever possible. The architecture scales naturally, keeps sensitive data server-side, and is intentionally structured to evolve without rewrites — which is exactly how I approach production system design.”*
