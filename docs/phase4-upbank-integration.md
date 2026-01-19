# Phase 4 Goals

## What we’re building now

1. **AppSync queries**

* `accounts`: returns Up accounts list
* `account(id)`: returns a single account details

2. **Resolver behavior**

* Identify user from Cognito (`ctx.identity.sub`)
* Fetch user’s Upbank token from **DynamoDB**
* Call Up API with `Authorization: Bearer <token>` (token is plaintext in this stage)
* Return mapped response to GraphQL schema

Up API specifics we’ll rely on:

* Base URL `https://api.up.com.au/api/v1`
* List accounts: `GET /accounts` → `https://api.up.com.au/api/v1/accounts`
* Retrieve account: `GET /accounts/{id}`
* Auth header: `Authorization: Bearer $your_access_token` ([Up API][1])

---

# Architecture change in Phase 4

### Why we **don’t** call Up API directly from the frontend

Because the Up token is sensitive and belongs server-side. The browser should never receive it.

### How AppSync will do it (Phase 4)

Use **pipeline resolvers**:

**Pipeline steps**

1. Function A (DynamoDB): `GetItem` to retrieve token by `USER#<sub>`
2. Function B (HTTP): call Up API `/accounts` or `/accounts/{id}` using token from step A

This is the cleanest managed approach: AppSync orchestrates **DDB + HTTP** without Lambda yet.

---

# Required AWS changes

## 1) Add an AppSync HTTP Data Source (Up API)

Create a datasource:

* `type = HTTP`
* endpoint = `https://api.up.com.au/api/v1` ([Up API][1])

No signing needed (it’s not an AWS service). Authentication will be via the bearer header dynamically at runtime.

## 2) Add pipeline functions

Create two AppSync **functions**:

* `FnGetTokenFromDdb` (data source: DynamoDB)
* `FnCallUpApi` (data source: HTTP)

Then create pipeline resolvers that run these functions in order.

---

# GraphQL schema changes (Phase 4)

Add these (keep types minimal at first):

```graphql
type Query {
  accounts: [UpAccount!]!
  account(id: ID!): UpAccount!
}

type UpAccount {
  id: ID!
  displayName: String!
  accountType: String!
  ownershipType: String!
  balanceValue: String!
  balanceValueInBaseUnits: Int!
  currencyCode: String!
}
```

> You can later expand it to match more fields from Up’s response (relationships, links, createdAt, etc.).

---

# DynamoDB expectations (no change to storage model)

We assume Phase 3 wrote this item:

* `pk = USER#<cognito_sub>`
* `sk = TOKEN#UPBANK`
* attributes include: `token` (plaintext), `updatedAt`

Phase 4 will read the same.

---

# AppSync resolver implementation details (JS runtime)

## Function A: Get token from DynamoDB

**Request**: GetItem on pk/sk using `ctx.identity.sub`

**Response**: return `{ token: "up:..." }` into the pipeline `stash` so the next function can use it.

Key rule: if token missing → throw a meaningful error (user must register token first).

## Function B: Call Up API (HTTP)

* For list accounts, call: `GET /accounts` ([Up API][1])
* For account details, call: `GET /accounts/{id}` ([Up API][1])
* Add header: `Authorization: Bearer <token>` ([Up API][1])

---

# Terraform module updates (what to add)

Inside your `application` module, add:

1. **HTTP datasource**

* `aws_appsync_datasource` with `type = "HTTP"` and endpoint `https://api.up.com.au/api/v1`

2. **AppSync functions**

* `aws_appsync_function` (or `aws_appsync_resolver` + function blocks depending on provider support)

  * `get_token` function → DynamoDB datasource
  * `call_up_api` function → HTTP datasource

3. **Pipeline resolvers**

* `aws_appsync_resolver` for:

  * `Query.accounts`
  * `Query.account`
* Each uses:

  * runtime `APPSYNC_JS`
  * `kind = PIPELINE`
  * functions list: `[FnGetTokenFromDdb, FnCallUpApi]`

4. **New resolver JS files**
   Recommended new files:

* `functions/GetTokenFromDdb.js`
* `functions/CallUpApiAccounts.js`
* `functions/CallUpApiAccountById.js`
* `resolvers/Query.accounts.js` (pipeline response mapping)
* `resolvers/Query.account.js`

This keeps logic clean and interview-friendly.

---

# Frontend updates (minimal)

Frontend should now call AppSync:

* `accounts`
* `account(id)`

It does **not** change auth: still `Authorization: <Cognito JWT>` to AppSync.

It does **not** see Up token ever.

---

# Testing checklist

1. Login
2. Register token (existing Phase 3)
3. Call `accounts`:

   * Expect list returned
4. Pick an account id; call `account(id)`
5. Validate error cases:

   * token missing → “Token not registered”
   * invalid token → Up API returns 401, AppSync surfaces error


# Key Issues Encountered & Learnings (Final Notes)

These are **important AWS-specific constraints** that are easy to miss and absolutely worth documenting.

---

## Issue 01 — `encodeURIComponent` not supported in AppSync JS runtime

### Problem

While implementing the HTTP function for:

```js
/accounts/{id}
```

the initial implementation used:

```js
encodeURIComponent(id)
```

This failed at runtime.

### Root cause

* AppSync **JS runtime is not Node.js**
* It does **not** support Node or browser globals
* Standard JavaScript APIs are limited to what AppSync provides

### Resolution

Use the AppSync utility equivalent:

```js
util.urlEncode(id)
```

### Learning

* AppSync JS resolvers run in a **sandboxed runtime**
* You must use utilities provided by:

  ```js
  import { util } from "@aws-appsync/utils";
  ```
* Any Node.js or browser-specific global APIs should be assumed **unsupported**

---

## Issue 02 — HTTP data source endpoint cannot include path segments

### Problem

The HTTP datasource was initially defined as:

```
https://api.up.com.au/api/v1
```

Terraform/AppSync rejected this configuration.

### Root cause

* **AppSync HTTP data sources only accept a base domain**
* Path segments are **not allowed** in the endpoint definition
* Paths must be supplied dynamically in the resolver via `resourcePath`

### Resolution

Datasource endpoint was changed to:

```
https://api.up.com.au
```

And resolvers now specify:

```js
resourcePath: "/api/v1/accounts"
```

or

```js
resourcePath: `/api/v1/accounts/${util.urlEncode(id)}`
```

### Learning

* AppSync HTTP data source design enforces **strict separation**:

  * Base URL → datasource
  * Path/query → resolver logic
* This pattern enables reuse of the same datasource across multiple endpoints

---

## Architectural Learnings (Consolidated)

* AppSync is **not generic GraphQL** — it has strong, opinionated execution rules
* DynamoDB is a **valid long-term choice** for sensitive tokens when combined with:

  * IAM
  * controlled access patterns
  * encryption (added later)
* Cost and scalability considerations matter even in labs
* SPA auth failures often originate from routing or hosting, not identity
* Runtime frontend config is essential when deploying SPAs to Kubernetes
* Managed services reduce operational burden but require understanding **service-specific constraints**

---

## Final Outcome

At completion:

* ✅ Authentication is fully managed
* ✅ Tokens never leave the server side
* ✅ AppSync orchestrates identity, persistence, and external API calls
* ✅ DynamoDB is the authoritative token store
* ✅ Frontend is environment-agnostic and EKS-friendly
* ✅ Infrastructure is modular, reproducible, and extensible

This lab now represents a **realistic, interview-ready, production-aligned architecture**, not a toy example.

---

# Future Improvement (Phase 4+ / Phase 5): Token Vault Lambda Broker Pattern

You already described the right direction:

### Add a Lambda “broker” (token vault)

All Up API requests go through a single Lambda that:

1. identifies the user (from AppSync identity / JWT claims)
2. retrieves token from DynamoDB
3. decrypts (once Phase 4 encryption is in place)
4. calls Up API downstream
5. returns sanitized response

**Why it’s valuable**

* Centralizes security logic (decryption, auditing, throttling)
* Allows caching and rate-limit handling
* Makes “token encryption + rotation” much easier to evolve without changing AppSync logic

In that model, AppSync would call:

* Lambda datasource instead of HTTP datasource
* DynamoDB lookup moves into Lambda
* Token never appears in AppSync stash/logging