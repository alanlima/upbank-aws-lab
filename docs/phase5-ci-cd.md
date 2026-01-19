# Phase 5 — CI/CD Integration (Option A now, Option B later)

## Goals

### Infra

* Automatically run Terraform when **`infra/**` changes
* Terraform state stored in **S3 backend** with **DynamoDB locking**
* Must work both from **GitHub Actions** and **local** commands

### Application (Frontend)

* Build Docker image and push to registry (ECR)
* Image tag must be the **commit hash**
* Auto-deploy to EKS via rollout:

  * Namespace: `frontend`
  * Deployment: `upbank-ui`
* App must display:

  * commit hash
  * build datetime (UTC)
* Those values must also be written as **annotations** on:

  * Deployment metadata (audit)
  * Pod template metadata (revision history + triggers rollout)

### Kubernetes manifests (not Terraform)

* Service / Ingress / Deployment baseline live under `k8s/`
* Apply them via a **bootstrap workflow**
* After baseline is created, normal deployments are done via **rollouts** only

---

# Repository Layout

```
infra/
  env/dev/
    backend.tf
    main.tf
    providers.tf
    versions.tf
  modules/
    application/
      ...

k8s/
  base/
    namespace.yaml
    configmap-runtime-config.yaml
    deployment.yaml
    service.yaml
    ingress.yaml
  overlays/
    dev/
      kustomization.yaml

app/
  Dockerfile
  nginx/default.conf
  src/...
```

---

# Step 1 — Create Terraform Remote Backend (S3 + DynamoDB lock)

> One-time bootstrap per AWS account/region.

## 1.1 Choose names

* S3 bucket (globally unique):

  * `upbank-terraform-state-<accountid>-ap-southeast-2`
* DynamoDB lock table:

  * `upbank-terraform-locks`

## 1.2 Create the S3 bucket and harden it

```bash
export AWS_REGION="ap-southeast-2"
export STATE_BUCKET="aws-lab-upbank-terraform-state"

aws s3api create-bucket \
  --bucket "$STATE_BUCKET" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"

# Block public access
aws s3api put-public-access-block \
  --bucket "$STATE_BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled

# Enable default encryption (SSE-S3)
aws s3api put-bucket-encryption \
  --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration '{
    "Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]
  }'
```

## 1.3 Create DynamoDB lock table

```bash
export LOCK_TABLE="upbank-terraform-locks"

aws dynamodb create-table \
  --table-name "$LOCK_TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$AWS_REGION"
```

---

# Step 2 — Configure Terraform backend (local + GitHub Actions)

In `infra/env/dev/backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket         = "upbank-terraform-state-<accountid>-ap-southeast-2"
    key            = "env/dev/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "upbank-terraform-locks"
    encrypt        = true
  }
}
```

### Local usage

```bash
cd infra/env/dev
terraform init
terraform plan
terraform apply
```

Now both local and CI share the same remote state + locking.

---

# Step 3 — GitHub Actions AWS access (OIDC)

Use GitHub Actions **OIDC** to assume an AWS role (no stored access keys).

The role must be able to:

* read/write S3 state bucket
* use DynamoDB lock table
* manage the Terraform resources (EKS/AppSync/Cognito/DDB/ECR etc.)
* push images to ECR
* update kubeconfig + run kubectl against the cluster

(You likely already have some access wiring; this is the expected mature approach.)

---

# Step 4 — Infra workflow (auto-apply on `infra/**` changes)

Create `.github/workflows/infra.yml`:

```yaml
name: infra

on:
  push:
    branches: [ main ]
    paths:
      - "infra/**"
  workflow_dispatch: {}

jobs:
  terraform:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<accountid>:role/GitHubActionsUpbankLabRole
          aws-region: ap-southeast-2

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        working-directory: infra/env/dev
        run: terraform init

      - name: Terraform Validate
        working-directory: infra/env/dev
        run: terraform validate

      - name: Terraform Plan
        working-directory: infra/env/dev
        run: terraform plan -out tfplan

      - name: Terraform Apply
        working-directory: infra/env/dev
        run: terraform apply -auto-approve tfplan
```

---

# Step 5 — Kubernetes manifests (Bootstrap pattern)

## 5.1 Base manifests (examples)

### `k8s/base/namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: frontend
```

### `k8s/base/configmap-runtime-config.yaml`

Your SPA loads `runtime-config.json` at runtime:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: upbank-ui-runtime-config
  namespace: frontend
data:
  runtime-config.json: |
    {
      "cognitoDomain": "REPLACE_ME",
      "cognitoClientId": "REPLACE_ME",
      "appsyncUrl": "REPLACE_ME"
    }
```

### `k8s/base/deployment.yaml`

Important: container name must be `upbank-ui` (matches rollout command)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: upbank-ui
  namespace: frontend
  annotations:
    app.upbank/commit: "bootstrap"
    app.upbank/buildDate: "bootstrap"
spec:
  replicas: 1
  selector:
    matchLabels:
      app: upbank-ui
  template:
    metadata:
      labels:
        app: upbank-ui
      annotations:
        app.upbank/commit: "bootstrap"
        app.upbank/buildDate: "bootstrap"
    spec:
      containers:
        - name: upbank-ui
          image: REPLACE_IMAGE
          ports:
            - containerPort: 80
          volumeMounts:
            - name: runtime-config
              mountPath: /usr/share/nginx/html/runtime-config.json
              subPath: runtime-config.json
      volumes:
        - name: runtime-config
          configMap:
            name: upbank-ui-runtime-config
```

### `k8s/base/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: upbank-ui
  namespace: frontend
spec:
  selector:
    app: upbank-ui
  ports:
    - port: 80
      targetPort: 80
```

### `k8s/base/ingress.yaml` (ALB)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: upbank-ui
  namespace: frontend
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
spec:
  rules:
    - http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: upbank-ui
                port:
                  number: 80
```

## 5.2 Kustomize overlay

`k8s/overlays/dev/kustomization.yaml`

```yaml
resources:
  - ../../base

namespace: frontend
```

---

# Step 6 — Bootstrap workflow (apply baseline k8s)

Create `.github/workflows/bootstrap-k8s.yml`:

```yaml
name: bootstrap-k8s

on:
  workflow_dispatch: {}
  push:
    branches: [ main ]
    paths:
      - "k8s/**"

jobs:
  apply_k8s:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    env:
      AWS_REGION: ap-southeast-2
      K8S_OVERLAY: k8s/overlays/dev

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<accountid>:role/GitHubActionsUpbankLabRole
          aws-region: ap-southeast-2

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name <your-eks-cluster-name> --region "${AWS_REGION}"

      - name: Apply baseline manifests
        run: kubectl apply -k "${K8S_OVERLAY}"
```

**How you use it**

* Run once after cluster creation
* Run whenever you change `k8s/**`
* Otherwise, normal app deployments do **rollout only**

---

# Step 7 — App pipeline (build → ECR → rollout)

## 7.1 Build metadata in the app

You have two config concerns:

### Runtime environment config (already)

* `runtime-config.json` mounted via ConfigMap

### Build metadata (immutable, image-baked)

Create `/build-info.json` in the image containing:

* commit hash
* build datetime (UTC)

UI reads `/build-info.json` and displays it to customers.

## 7.2 App workflow `.github/workflows/app.yml`

```yaml
name: app

on:
  push:
    branches: [ main ]
    paths:
      - "app/**"
  workflow_dispatch: {}

jobs:
  build_push_rollout:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read

    env:
      AWS_REGION: ap-southeast-2
      ECR_REPO: upbank-ui
      K8S_NAMESPACE: frontend
      DEPLOYMENT_NAME: upbank-ui

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::<accountid>:role/GitHubActionsUpbankLabRole
          aws-region: ap-southeast-2

      - name: Login to ECR
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build & push image
        working-directory: app
        run: |
          SHA="${GITHUB_SHA}"
          BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

          ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
          IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}:${SHA}"

          docker build \
            --build-arg BUILD_SHA="${SHA}" \
            --build-arg BUILD_DATE="${BUILD_DATE}" \
            -t "${IMAGE_URI}" \
            .

          docker push "${IMAGE_URI}"

          echo "IMAGE_URI=${IMAGE_URI}" >> $GITHUB_ENV
          echo "BUILD_DATE=${BUILD_DATE}" >> $GITHUB_ENV
          echo "BUILD_SHA=${SHA}" >> $GITHUB_ENV

      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name <your-eks-cluster-name> --region "${AWS_REGION}"

      - name: Rollout (set image)
        run: |
          kubectl -n "${K8S_NAMESPACE}" set image deployment/"${DEPLOYMENT_NAME}" \
            "${DEPLOYMENT_NAME}"="${IMAGE_URI}"

      - name: Add annotations (deployment + pod template)
        run: |
          kubectl -n "${K8S_NAMESPACE}" annotate deployment/"${DEPLOYMENT_NAME}" \
            app.upbank/commit="${BUILD_SHA}" \
            app.upbank/buildDate="${BUILD_DATE}" \
            --overwrite

          kubectl -n "${K8S_NAMESPACE}" patch deployment/"${DEPLOYMENT_NAME}" \
            --type='merge' \
            -p "{\"spec\":{\"template\":{\"metadata\":{\"annotations\":{\"app.upbank/commit\":\"${BUILD_SHA}\",\"app.upbank/buildDate\":\"${BUILD_DATE}\"}}}}}"

      - name: Wait for rollout
        run: kubectl -n "${K8S_NAMESPACE}" rollout status deployment/"${DEPLOYMENT_NAME}" --timeout=300s
```

---

# Step 8 — Future improvement (Option B / GitOps)

Later replace “bootstrap workflow” with:

* ArgoCD/Flux installed in cluster
* It reconciles `k8s/overlays/dev`
* App pipeline either:

  * commits image tag changes to git, or
  * uses image automation

Your current `k8s/base + overlays` layout is already GitOps-ready.

---

# Final Notes (why this is the right approach)

* Terraform runs only when infra changes (`infra/**`)
* Kubernetes base resources are applied via a controlled bootstrap (`k8s/**`)
* App deployments are fast rollouts and don’t depend on Terraform state
* Build metadata is visible to customers and traceable via annotations
* The structure cleanly transitions to GitOps in the future
