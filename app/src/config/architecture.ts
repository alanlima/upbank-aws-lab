export type ArchitectureGroup = 'core' | 'observability' | 'future' | 'base' | 'ui' | 'api' | 'auth' | 'tls'

export type ArchitectureNode = {
  id: string
  label: string
  description: string
  why: string
  security: string
  failure: string
  x: number
  y: number
  group: ArchitectureGroup
  category: 'edge' | 'compute' | 'auth' | 'data' | 'external' | 'ops'
  icon?: string
}

export type ArchitectureEdge = {
  id: string
  from: string
  to: string
  label?: string
  group: ArchitectureGroup
}

export type ArchitectureZone = {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  tone: 'region' | 'vpc' | 'az' | 'public' | 'private' | 'managed'
}

export type ArchitectureConfig = {
  width: number
  height: number
  zones: ArchitectureZone[]
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT DESIGN
// ═══════════════════════════════════════════════════════════════════════════
//
// REQUEST FLOW:
//   Browser → Route53 (DNS) → Endpoint based on domain:
//     - upbank-lab.*      → ALB → EKS       (UI flow - blue)
//     - api.upbank-lab.*  → AppSync         (API flow - orange)
//     - auth.upbank-lab.* → Cognito         (Auth flow - purple)
//
// ACM CERTIFICATES:
//   ACM provides TLS certs TO endpoints (not Route53):
//     - ACM → ALB (TLS termination for UI)
//     - ACM → AppSync (custom domain TLS)
//     - ACM → Cognito (custom domain TLS)
//   Route53 is only used for DNS validation of cert ownership.
//
// EDGE COLORS (group):
//   - 'ui'   → Blue   - Frontend/UI traffic (upbank-lab.*)
//   - 'api'  → Orange - API traffic (api.upbank-lab.*)
//   - 'auth' → Purple - Auth traffic (auth.upbank-lab.*)
//   - 'tls'  → Gray   - TLS certificate provisioning
//   - 'base' → Teal   - Infrastructure/internal
//
// ═══════════════════════════════════════════════════════════════════════════

export const architectureConfig: ArchitectureConfig = {
  width: 1600,
  height: 950,

  zones: [
    // ═══════════════════════════════════════════════════════════════
    // AWS REGION
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'region',
      label: 'AWS Region (ap-southeast-2)',
      x: 400,
      y: 180,
      width: 700,
      height: 640,
      tone: 'region',
    },

    // ═══════════════════════════════════════════════════════════════
    // VPC - Network boundary
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'vpc',
      label: 'VPC 10.0.0.0/16',
      x: 420,
      y: 280,
      width: 660,
      height: 520,
      tone: 'vpc',
    },

    // ═══════════════════════════════════════════════════════════════
    // AVAILABILITY ZONES
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'az-a',
      label: 'Availability Zone A',
      x: 440,
      y: 325,
      width: 305,
      height: 455,
      tone: 'az',
    },
    {
      id: 'az-b',
      label: 'Availability Zone B',
      x: 755,
      y: 325,
      width: 305,
      height: 455,
      tone: 'az',
    },

    // ═══════════════════════════════════════════════════════════════
    // SUBNETS
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'public-a',
      label: 'Public Subnet',
      x: 460,
      y: 370,
      width: 265,
      height: 190,
      tone: 'public',
    },
    {
      id: 'private-a',
      label: 'Private Subnet',
      x: 460,
      y: 580,
      width: 265,
      height: 180,
      tone: 'private',
    },
    {
      id: 'public-b',
      label: 'Public Subnet',
      x: 775,
      y: 370,
      width: 265,
      height: 190,
      tone: 'public',
    },
    {
      id: 'private-b',
      label: 'Private Subnet',
      x: 775,
      y: 580,
      width: 265,
      height: 180,
      tone: 'private',
    },

    // ═══════════════════════════════════════════════════════════════
    // AWS MANAGED SERVICES - Outside VPC
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'managed-services',
      label: 'AWS Managed Services',
      x: 1150,
      y: 230,
      width: 280,
      height: 560,
      tone: 'managed',
    },
  ],

  nodes: [
    // ═══════════════════════════════════════════════════════════════
    // USER BROWSER - Entry point
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'browser',
      label: 'User Browser',
      description: 'The read-only React UI where the lab starts and ends.',
      why: 'All requests start here. DNS queries go to Route53 first, which resolves to the appropriate endpoint based on domain.',
      security: 'Tokens never live in the UI; only masked status is shown after registration.',
      failure: 'If the UI fails to load, check DNS resolution and target endpoint health.',
      x: 140,
      y: 520,
      group: 'base',
      category: 'edge',
      icon: 'user',
    },

    // ═══════════════════════════════════════════════════════════════
    // ROUTE53 - DNS resolution (all traffic flows through here first)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'route53',
      label: 'Route53',
      description: 'Public DNS that resolves all three application domains.',
      why: 'Every browser request first queries Route53 to resolve the domain. Returns endpoint addresses for upbank-lab.*, api.upbank-lab.*, and auth.upbank-lab.*',
      security: 'DNS changes controlled via IaC. Supports DNSSEC. Also used for ACM certificate DNS validation.',
      failure: 'Misconfigured records cause resolution failures. Check hosted zone and record sets.',
      x: 140,
      y: 250,
      group: 'base',
      category: 'edge',
      icon: 'route53',
    },

    // ═══════════════════════════════════════════════════════════════
    // ACM - TLS certificates (provides certs to TLS-terminating endpoints)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'acm',
      label: 'ACM Certificates',
      description: 'Managed TLS certificates for all three custom domains.',
      why: 'Provides TLS certificates to ALB, AppSync, and Cognito for HTTPS termination. Certificates are validated via Route53 DNS records.',
      security: 'Auto-renewed certificates. Private keys never leave AWS. DNS validation proves domain ownership.',
      failure: 'Expired or invalid certificates cause HTTPS errors. Check validation status in ACM console.',
      x: 990,
      y: 110,
      group: 'tls',
      category: 'edge',
      icon: 'acm',
    },

    // ═══════════════════════════════════════════════════════════════
    // INTERNET GATEWAY - VPC boundary
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'internet-gateway',
      label: 'Internet Gateway',
      description: 'Enables public internet connectivity for the VPC.',
      why: 'Required for ALB to receive inbound traffic and for NAT Gateway outbound access.',
      security: 'Route tables and security groups control traffic flow.',
      failure: 'Missing routes or detached IGW causes connectivity failures.',
      x: 760,
      y: 180,
      group: 'base',
      category: 'edge',
      icon: 'igw',
    },

    // ═══════════════════════════════════════════════════════════════
    // ALB - Frontend ingress (Public Subnet A)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'alb',
      label: 'ALB Ingress',
      description: 'Application Load Balancer for the frontend UI.',
      why: 'Receives traffic for upbank-lab.* after Route53 DNS resolution. Terminates TLS using ACM certificate and routes to EKS.',
      security: 'Security groups restrict to HTTPS (443). WAF can be attached.',
      failure: 'Check target group health, listener rules, and ACM certificate attachment.',
      x: 593,
      y: 470,
      group: 'ui',
      category: 'edge',
      icon: 'alb',
    },

    // ═══════════════════════════════════════════════════════════════
    // NAT GATEWAY - Outbound internet (Public Subnet B)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'nat-gateway',
      label: 'NAT Gateway',
      description: 'Provides outbound internet access for private subnets.',
      why: 'Allows EKS pods to pull container images and reach external APIs if needed.',
      security: 'One-way outbound only. Private workloads remain unexposed.',
      failure: 'Check Elastic IP association and route table entries.',
      x: 908,
      y: 470,
      group: 'base',
      category: 'edge',
      icon: 'nat',
    },

    // ═══════════════════════════════════════════════════════════════
    // EKS FRONTEND - Application workload (Private Subnet A)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'eks-frontend',
      label: 'EKS / Frontend (Nginx)',
      description: 'Kubernetes cluster hosting the React SPA via Nginx.',
      why: 'Serves the static frontend for upbank-lab.* domain. Receives traffic from ALB.',
      security: 'Pods in private subnet. No direct internet exposure. Uses IRSA for AWS API access.',
      failure: 'Check pod status, Nginx logs, and ALB target group registration.',
      x: 593,
      y: 675,
      group: 'ui',
      category: 'compute',
      icon: 'eks',
    },

    // ═══════════════════════════════════════════════════════════════
    // OBSERVABILITY - Monitoring stack (Private Subnet B)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'observability',
      label: 'Prometheus / Grafana',
      description: 'Metrics collection and visualization for the cluster.',
      why: 'Provides observability into EKS workloads and application metrics.',
      security: 'Runs in private subnet. Access via ingress or kubectl port-forward.',
      failure: 'Check ServiceMonitor CRDs and Prometheus scrape targets.',
      x: 908,
      y: 675,
      group: 'observability',
      category: 'ops',
      icon: 'cloudwatch',
    },

    // ═══════════════════════════════════════════════════════════════
    // AWS MANAGED SERVICES (inside managed-services zone)
    // ═══════════════════════════════════════════════════════════════

    // COGNITO - auth.upbank-lab.*
    {
      id: 'cognito',
      label: 'Cognito User Pool',
      description: 'Managed authentication service with hosted UI.',
      why: 'Handles auth.upbank-lab.* traffic. Provides OAuth2/OIDC flows and issues JWTs.',
      security: 'AWS managed. Supports MFA, password policies. Custom domain uses ACM certificate.',
      failure: 'Check app client settings, callback URLs, and custom domain configuration.',
      x: 1290,
      y: 330,
      group: 'auth',
      category: 'auth',
      icon: 'cognito',
    },

    // APPSYNC - api.upbank-lab.*
    {
      id: 'appsync',
      label: 'AppSync GraphQL API',
      description: 'Managed GraphQL service for the API layer.',
      why: 'Handles api.upbank-lab.* traffic. Validates Cognito JWTs and orchestrates data operations.',
      security: 'Cognito authorizer validates tokens. Custom domain uses ACM certificate.',
      failure: 'Check resolver mappings, authorizer config, and CloudWatch logs.',
      x: 1290,
      y: 520,
      group: 'api',
      category: 'compute',
      icon: 'appsync',
    },

    // DYNAMODB - Token storage
    {
      id: 'dynamodb',
      label: 'DynamoDB Token Registry',
      description: 'NoSQL database storing user PATs securely.',
      why: 'AppSync resolvers read/write tokens here. Keyed by Cognito user sub.',
      security: 'Encrypted at rest. IAM restricts access to AppSync service role only.',
      failure: 'Check table status, IAM permissions, and VTL resolver mappings.',
      x: 1290,
      y: 710,
      group: 'api',
      category: 'data',
      icon: 'dynamodb',
    },

    // ═══════════════════════════════════════════════════════════════
    // EXTERNAL SERVICE
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'up-api',
      label: 'Up Bank API',
      description: 'External banking API for account data.',
      why: 'AppSync HTTP resolver fetches account data using stored PAT from DynamoDB.',
      security: 'PAT retrieved per-request from DynamoDB. Never exposed to frontend.',
      failure: 'Handle 429 rate limits and 5xx errors. Implement exponential backoff.',
      x: 1650,
      y: 515,
      group: 'api',
      category: 'external',
      icon: 'api',
    },
  ],

  edges: [
    // ═══════════════════════════════════════════════════════════════
    // BROWSER → ROUTE53 (DNS lookup - all traffic starts here)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'browser-route53',
      from: 'browser',
      to: 'route53',
      label: 'DNS lookup',
      group: 'base',
    },

    // ═══════════════════════════════════════════════════════════════
    // ROUTE53 → ENDPOINTS (color-coded by traffic type)
    // ═══════════════════════════════════════════════════════════════

    // UI flow (blue) - upbank-lab.* → ALB
    {
      id: 'route53-alb',
      from: 'route53',
      to: 'alb',
      label: 'upbank-lab.*',
      group: 'ui',
    },

    // API flow (orange) - api.upbank-lab.* → AppSync
    {
      id: 'route53-appsync',
      from: 'route53',
      to: 'appsync',
      label: 'api.upbank-lab.*',
      group: 'api',
    },

    // Auth flow (purple) - auth.upbank-lab.* → Cognito
    {
      id: 'route53-cognito',
      from: 'route53',
      to: 'cognito',
      label: 'auth.upbank-lab.*',
      group: 'auth',
    },

    // ═══════════════════════════════════════════════════════════════
    // ACM → ENDPOINTS (TLS certificate provisioning)
    // ═══════════════════════════════════════════════════════════════
    {
      id: 'acm-alb',
      from: 'acm',
      to: 'alb',
      label: 'TLS cert',
      group: 'tls',
    },
    {
      id: 'acm-appsync',
      from: 'acm',
      to: 'appsync',
      label: 'TLS cert',
      group: 'tls',
    },
    {
      id: 'acm-cognito',
      from: 'acm',
      to: 'cognito',
      label: 'TLS cert',
      group: 'tls',
    },

    // ═══════════════════════════════════════════════════════════════
    // VPC INTERNAL FLOWS
    // ═══════════════════════════════════════════════════════════════

    // ALB → EKS (UI flow continues)
    {
      id: 'alb-eks',
      from: 'alb',
      to: 'eks-frontend',
      group: 'ui',
    },

    // EKS → Observability (metrics)
    {
      id: 'eks-observability',
      from: 'eks-frontend',
      to: 'observability',
      group: 'observability',
    },

    // NAT → IGW (egress path)
    {
      id: 'nat-igw',
      from: 'nat-gateway',
      to: 'internet-gateway',
      group: 'base',
    },

    // ═══════════════════════════════════════════════════════════════
    // AWS MANAGED SERVICE INTEGRATIONS
    // ═══════════════════════════════════════════════════════════════

    // Cognito → AppSync (JWT validation)
    {
      id: 'cognito-appsync',
      from: 'cognito',
      to: 'appsync',
      label: 'JWT auth',
      group: 'auth',
    },

    // AppSync → DynamoDB (token storage)
    {
      id: 'appsync-dynamo',
      from: 'appsync',
      to: 'dynamodb',
      label: 'token lookup',
      group: 'api',
    },

    // AppSync → Up Bank API (external fetch)
    {
      id: 'appsync-up',
      from: 'appsync',
      to: 'up-api',
      label: 'fetch data',
      group: 'api',
    },
  ],
}