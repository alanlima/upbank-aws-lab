# 📎 Appendix A — Key Learnings & Failure Patterns

This appendix consolidates **key failure patterns and architectural learnings** identified during the lab.
It is intended to preserve **operational knowledge** so that these issues are not rediscovered in later phases or future projects.

The patterns below reflect **real Amazon EKS behaviour**.

---

## Issue 01 — Node Group Creation Failed Because Network Addon Was Missing

### Symptom

* Managed node group stuck in `CREATING`
* Nodes created but remained `NotReady`
* Errors observed:

  * `NodeCreationFailure`
  * `NetworkPluginNotReady`
  * `cni plugin not initialized`

### Root Cause

* Core EKS networking addon (**VPC CNI**) was **not installed at cluster creation time**
* Addons were defined as standalone `aws_eks_addon` resources, applied *after* cluster and node group creation
* Node bootstrap began without networking available

### Diagnosis

* `kubectl describe node` showed:

  ```
  Ready=False
  Reason=NetworkPluginNotReady
  ```
* `aws-node` pods missing or failing in `kube-system`
* Node registered with control plane but never became Ready

### Resolution

* Define core addons **directly in the EKS cluster creation**
* Treat addons as part of the platform, not post-install steps

### Key Learning

> Core EKS addons are **hard dependencies**, not optional components.
> Without the network addon, nodes cannot ever become Ready.

---

## Issue 02 — Addons Defined but Node Group Still Created Too Early

### Symptom

* Node group creation intermittently failed
* Behaviour was inconsistent and timing-dependent
* Failures appeared “random”

### Root Cause

* Terraform executed cluster, addons, and node group **in parallel**
* Node group bootstrap started **before addons finished installing**
* EKS bootstrap is order-sensitive by nature

### Diagnosis

* Addons visible in AWS Console
* Nodes already failing before addon installation completed

### Resolution

Two explicit configurations were required:

```hcl
dataplane_wait_duration = "60s"
```

and

```hcl
addons = {
  vpc-cni = {
    before_compute = true
  }
  kube-proxy = {
    before_compute = true
  }
  coredns = {
    before_compute = true
  }
}
```

This enforced the correct lifecycle:

1. Control plane creation
2. Addon installation
3. Explicit wait
4. Node group creation

### Key Learning

> EKS bootstrap is **order-dependent**.
> Terraform must be told what *must exist before compute*.

---

## Issue 03 — Cluster Unreachable from kubectl / Helm Due to Private Endpoint

### Symptom

Helm installation failed with:

```text
Kubernetes cluster unreachable: Get "https://<eks-endpoint>/version":
dial tcp 10.40.1.247:443: i/o timeout
```

### Root Cause

* EKS control plane endpoint configured as **private-only**
* Local machine not connected to the VPC
* No VPN, bastion, or VPC-connected environment

### Diagnosis

Endpoint resolution check:

```bash
nslookup <eks-endpoint>
```

Observed:

```
10.x.x.x
```

This confirmed the endpoint was private-only.

### Resolution

For this lab:

* Enable `endpoint_public_access = true`

Alternative (production-valid) solutions:

* VPN
* Bastion host
* Private CI runner inside the VPC

### Key Learning

> Private EKS endpoints are secure and valid —
> but they require network access into the VPC.

---

## Issue 04 — Node Registration ≠ Node Readiness

### Symptom

* Node visible in `kubectl get nodes`
* Node group remained `CREATING`
* No IAM or quota errors present

### Root Cause

* Node successfully contacted control plane
* Kubelet started
* Networking (CNI) not initialized, blocking readiness

### Diagnosis

* Node conditions:

  ```
  Ready=False
  NetworkPluginNotReady
  ```
* `kube-system` pods not fully running

### Resolution

* Debug **system pods first**
* Validate addons and node conditions before application workloads

### Key Learning

> A node can exist, register, and still be completely unusable.

---

## Issue 05 — IAM User Lacked Access to the EKS Cluster

### Symptom

* `kubectl` and Helm failed even though:

  * the cluster was healthy
  * the endpoint was reachable
* Errors appeared generic or misleading (or actions silently failed)

### Root Cause

* The IAM user executing `kubectl` / `helm` was **not granted EKS cluster access**
* EKS uses **Access Entries** for cluster authorization (instead of relying only on legacy mechanisms)
* No access entry existed for the user

### Diagnosis

* AWS credentials were valid (`aws sts get-caller-identity` ok)
* Cluster endpoint reachable
* Kubernetes API requests failed due to missing authorization

### Resolution

Add an **EKS access entry** for the IAM user with:

```text
arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy
```

This grants administrative access required to run cluster operations.

### Key Learning

> IAM authentication ≠ Kubernetes authorization.
> EKS access entries are required for users to interact with the cluster.

---

## Issue 06 — Tool Errors Often Mask Platform Problems

### Symptom

* Helm failures
* Terraform errors
* Messages pointing at tooling rather than infrastructure

### Root Cause

Underlying issues were typically one of:

* missing addons
* incorrect resource ordering
* endpoint reachability (private-only endpoint from non-VPC client)
* missing EKS access entries

### Key Learning

> Terraform and Helm surface **symptoms**, not causes.
> Always inspect cluster state and access control directly.

---

## Strategic Takeaways

* EKS is a **platform**, not just a resource
* Addons are part of the platform contract
* Ordering and dependencies matter
* Control plane access is an explicit design decision
* Access Entries are mandatory for human/admin access
* Debugging should start at the **lowest failing layer** (network → node → system pods → workloads)

---

## Final Takeaway

> Most real-world EKS failures are **dependency, ordering, access, and visibility problems**.

This appendix exists so those lessons are **documented once and reused forever**.
