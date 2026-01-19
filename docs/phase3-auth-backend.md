# Phase 3 — Application & Authentication Layer (Cognito + AppSync)

## Overview

Phase 3 introduces the **application layer** of the lab using **fully managed AWS services**, focusing on **authentication, authorization, and GraphQL data access**.

Instead of deploying a custom backend on EKS, this phase intentionally leverages **Amazon Cognito** and **AWS AppSync** to reduce operational complexity while enforcing strong security boundaries. The frontend is implemented as a **Single Page Application (SPA)** using **Vite + React + TypeScript** and deployed as static assets behind Nginx.

This phase establishes a production-grade pattern commonly used in modern cloud-native applications.

---

## Phase 3 Architecture

### High-level flow

1. User accesses the frontend SPA
2. User authenticates via **Cognito Hosted UI** (OAuth2 Authorization Code + PKCE)
3. Cognito issues **JWT tokens**
4. SPA calls **AppSync GraphQL API** with JWT
5. AppSync validates the token against the Cognito User Pool
6. AppSync resolvers execute:

   * Identity-only resolvers (`NONE` data source)
   * DynamoDB-backed resolvers (token registration)
7. DynamoDB stores application state (token registration metadata)

---

## Goals of Phase 3

* Implement secure **user authentication** using Cognito
* Use **managed GraphQL (AppSync)** instead of a self-hosted API
* Persist minimal user state using DynamoDB
* Deliver a functional SPA with client-side routing
* Encapsulate the entire application stack into a **Terraform module**

---

## Technology Stack

### Frontend

* Vite
* React
* TypeScript
* React Router
* Nginx (static hosting)

### AWS Managed Services

* Amazon Cognito (User Pool + Hosted UI)
* AWS AppSync (GraphQL API)
* Amazon DynamoDB (token registry)
* AWS IAM (least-privilege access for AppSync)

### Infrastructure as Code

* Terraform (application module)

---

## Functional Scope

### Implemented

* User login via Cognito Hosted UI
* OAuth2 Authorization Code flow with PKCE
* JWT-based authorization for GraphQL
* GraphQL queries and mutations via AppSync
* Token registration flow (lab-only persistence)
* SPA routing with client-side navigation

### Explicitly Out of Scope (for Phase 3)

* Transactions view
* Backend services on EKS
* Secrets Manager integration
* Autoscaling or cost optimisation

---

## Key Design Decisions

### Why AppSync instead of a custom GraphQL backend

* Removes need to manage API servers
* Native Cognito integration
* Built-in JWT validation
* Fine-grained IAM-based data access
* Scales automatically

### Why DynamoDB

* Serverless, low cost for lab usage
* Simple key-based access pattern
* Works natively with AppSync resolvers

### Why Vite + React SPA

* Fast development feedback loop
* Simple static build output
* Ideal fit for Cognito Hosted UI redirects
* Clean separation between frontend and backend concerns

---

## Issues Encountered & Learnings

### Issue 1 — Identity-only resolvers require a `NONE` data source

**Problem**

The `Query.me` resolver only returns identity information from the JWT (`ctx.identity`) and does not call any backend service. However, AppSync does not allow a resolver to exist without a data source.

**Resolution**

A dedicated `NONE` data source was created and attached to the resolver:

```hcl
resource "aws_appsync_datasource" "none" {
  api_id = aws_appsync_graphql_api.this.id
  name   = "NoneDataSource"
  type   = "NONE"

  description = "Local resolver data source for AppSync"
}
```

**Learning**

* AppSync enforces a strict resolver → data source relationship
* `NONE` data sources are the canonical AWS pattern for:

  * identity-only resolvers
  * computed fields
  * local logic without I/O

---

### Issue 2 — SPA routing breaks OAuth redirects without Nginx fallback

**Problem**

After authentication, Cognito redirects the browser to `/callback`.
Without special handling, Nginx attempted to resolve `/callback` as a file and returned `404`.

**Resolution**

Nginx was configured to redirect all unknown paths back to `index.html`, allowing React Router to handle routing:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Learning**

* SPAs require server-side fallback routing
* OAuth redirect flows depend on deep links
* Authentication failures can appear frontend-related even when Cognito is working correctly

---

## Security Considerations

* No secrets are embedded in the frontend
* OAuth client uses PKCE and has no client secret
* JWT validation is fully managed by AppSync
* DynamoDB access is restricted to AppSync IAM role
* Tokens are never returned from GraphQL responses

> Note: For lab purposes, the Upbank token is stored in DynamoDB.
> In a production system, this would be migrated to **AWS Secrets Manager**.

---

## Terraform Module Boundary

The **application module** includes:

* Cognito User Pool, Client, and Domain
* AppSync GraphQL API and schema
* DynamoDB table
* AppSync data sources and resolvers
* IAM roles and policies

It explicitly excludes:

* VPC / EKS
* Load balancers
* CI/CD pipelines

This allows the application layer to evolve independently from infrastructure.

---

## Definition of Done (Phase 3)

* ✅ User can authenticate via Cognito
* ✅ SPA receives and stores JWTs
* ✅ AppSync authorizes GraphQL requests
* ✅ Identity is accessible in resolvers
* ✅ Token registration state persists in DynamoDB
* ✅ SPA routing works correctly behind Nginx
* ✅ Entire stack deploys via Terraform module

## Phase 3 Retrospective (Final)

### Design intent clarification

Two decisions in Phase 3 were **intentional end-state choices**, not temporary compromises:

1. **DynamoDB is the final persistence layer for the token**
2. **Frontend configuration is runtime-driven, not build-time**

These choices shape how Phase 4 evolves and reflect real-world scalability and cost considerations.

---

## What went well

### DynamoDB chosen as the long-term token store

The lab deliberately uses **DynamoDB as the final system of record** for storing the Upbank token.

This decision was based on:

* **Scalability**

  * DynamoDB scales horizontally without operational overhead
  * Supports high read/write throughput patterns if token usage expands (e.g. background jobs, event processing, fan-out)

* **Extensibility**

  * Token records can evolve to include:

    * metadata (status, scopes, expiry)
    * audit fields
    * encryption context
    * future multi-token or multi-provider support
  * Schema evolution is simpler than Secrets Manager’s object-centric model

* **Cost efficiency**

  * DynamoDB (PAY_PER_REQUEST) is **significantly cheaper** than Secrets Manager at scale
  * Secrets Manager pricing becomes non-trivial when storing large numbers of secrets or performing frequent access

This aligns with a **data-centric architecture**, where tokens are treated as application data rather than infrastructure secrets.

> The security model is handled at the **application + IAM boundary**, not by outsourcing storage semantics to Secrets Manager.

---

### AppSync + DynamoDB remains a strong managed-backend pattern

Using AppSync as the GraphQL layer with DynamoDB as the persistence backend:

* removes the need for backend compute in early phases
* keeps authorization declarative and enforced at the edge
* simplifies scaling and operational concerns

Resolvers directly accessing DynamoDB allowed:

* predictable latency
* strict access control
* minimal moving parts

---

### Runtime frontend configuration improved deployment flexibility

The frontend was updated to load configuration from a **`runtime-config.json`** file instead of relying solely on build-time `VITE_` variables.

This change provides:

* **Environment flexibility**

  * Same frontend image can be deployed to dev/sit/prd
  * Configuration is injected at deploy time (via Nginx / ConfigMap)

* **EKS-friendly deployments**

  * ConfigMap → volume mount → `runtime-config.json`
  * No rebuild required when:

    * ALB DNS changes
    * AppSync endpoint changes
    * Cognito domain changes

* **Cleaner CI/CD**

  * One artifact promoted across environments
  * Reduced coupling between frontend build and infrastructure state

This mirrors how SPAs are deployed in mature Kubernetes environments.

---

## Challenges encountered

### AppSync resolver constraints required AWS-specific patterns

The `Query.me` resolver exposed an AppSync-specific constraint:

* All resolvers **must be bound to a data source**
* Even identity-only resolvers require a `NONE` data source

This is non-obvious from a GraphQL perspective but is a **canonical AWS pattern**.

The resolution reinforced the need to understand **service-level execution models**, not just abstract APIs.

---

### SPA routing required explicit server configuration

OAuth redirects (`/callback`) initially failed due to missing SPA routing support in Nginx.

The fix:

```nginx
try_files $uri $uri/ /index.html;
```

This reinforced a common production lesson:

> Authentication failures are often caused by routing or hosting configuration, not identity services.

---

## Trade-offs made consciously

### Token encryption deferred, not ignored

Tokens are currently stored **unencrypted at the application level** in DynamoDB.

This was a **deliberate sequencing decision**, not an oversight.

* DynamoDB already provides **encryption at rest via AWS-managed KMS**
* Phase 4 will introduce:

  * application-level encryption
  * customer-managed KMS keys
  * envelope encryption patterns if required

This allowed Phase 3 to focus on:

* auth correctness
* data flow
* resolver design

without prematurely introducing cryptographic complexity.

---

## What improves in the next phase (Phase 4)

### Application-level encryption at rest

* Encrypt token value before persisting to DynamoDB
* Use KMS (CMK) with:

  * explicit encryption context
  * least-privilege IAM
* Store ciphertext + metadata instead of plaintext

### Token lifecycle management

* Expiry handling
* Rotation
* Revocation support

### Observability

* Resolver metrics
* Auth failure visibility
* DynamoDB access patterns

---

## Key learnings

* DynamoDB is a valid and often superior alternative to Secrets Manager for **high-scale sensitive data**
* Security is about **design and access control**, not just storage choice
* Managed services reduce operational load but impose architectural constraints
* SPA deployments require explicit support for client-side routing
* Runtime configuration is essential for Kubernetes-based frontend deployments

---

## Interview takeaway

Phase 3 demonstrates:

* Intentional architectural decision-making
* Cost and scalability awareness
* Understanding of AWS managed service trade-offs
* Ability to evolve a system incrementally without rework
* Production-oriented thinking even in a lab context

Rather than treating DynamoDB storage as a compromise, this phase establishes it as the **correct long-term design**, with security enhancements layered on deliberately in subsequent phases.