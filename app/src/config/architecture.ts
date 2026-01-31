export type ArchitectureGroup = 'core' | 'observability' | 'future' | 'base'

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
  group: ArchitectureGroup
}

export type ArchitectureZone = {
  id: string
  label: string
  x: number
  y: number
  width: number
  height: number
  tone: 'region' | 'vpc' | 'az' | 'public' | 'private'
}

export type ArchitectureConfig = {
  width: number
  height: number
  zones: ArchitectureZone[]
  nodes: ArchitectureNode[]
  edges: ArchitectureEdge[]
}

export const architectureConfig: ArchitectureConfig = {
  width: 1500,
  height: 820,
  zones: [
    { id: 'region', label: 'AWS Region (ap-southeast-2)', x: 60, y: 100, width: 1360, height: 700, tone: 'region' },
    { id: 'vpc', label: 'VPC 10.0.0.0/16', x: 140, y: 180, width: 1220, height: 540, tone: 'vpc' },
    { id: 'az-a', label: 'Availability Zone A', x: 160, y: 240, width: 520, height: 420, tone: 'az' },
    { id: 'az-b', label: 'Availability Zone B', x: 780, y: 240, width: 520, height: 420, tone: 'az' },
    { id: 'public-a', label: 'Public Subnet', x: 190, y: 280, width: 470, height: 150, tone: 'public' },
    { id: 'private-a', label: 'Private Subnet', x: 190, y: 460, width: 470, height: 170, tone: 'private' },
    { id: 'public-b', label: 'Public Subnet', x: 810, y: 280, width: 470, height: 150, tone: 'public' },
    { id: 'private-b', label: 'Private Subnet', x: 810, y: 460, width: 470, height: 170, tone: 'private' },
  ],
  nodes: [
    {
      id: 'browser',
      label: 'User Browser',
      description: 'The read-only React UI where the lab starts and ends.',
      why: 'Routes through Route53 for three paths: (1) load SPA assets from EKS, (2) send GraphQL API calls to AppSync, and (3) go through Cognito for auth.',
      security: 'Tokens never live in the UI; only masked status is shown after registration.',
      failure: 'If the UI fails to load, check the EKS ingress and static asset delivery.',
      x: 70,
      y: 420,
      group: 'core',
      category: 'edge',
      icon: 'user',
    },
    {
      id: 'route53',
      label: 'Route53',
      description: 'Public DNS for the UI, API, and Cognito Hosted UI.',
      why: 'User traffic hits Route53 for frontend load (EKS), API calls (AppSync), and auth flows (Cognito).',
      security: 'DNS changes are tightly controlled with IaC and audit trails.',
      failure: 'Misconfigured records lead to routing or validation failures.',
      x: 420,
      y: 220,
      group: 'base',
      category: 'edge',
      icon: 'route53',
    },
    {
      id: 'acm',
      label: 'ACM Certificates',
      description: 'Managed TLS certificates for UI, Cognito, and AppSync domains.',
      why: 'Automates certificate rotation and keeps TLS managed.',
      security: 'Certificates are validated via DNS and scoped to the domain.',
      failure: 'Failed validation or missing records can break HTTPS.',
      x: 640,
      y: 220,
      group: 'base',
      category: 'edge',
      icon: 'acm',
    },
    {
      id: 'internet-gateway',
      label: 'Internet Gateway',
      description: 'Enables public routing for the VPC.',
      why: 'Required for public subnets and external connectivity.',
      security: 'Route tables control which subnets are exposed.',
      failure: 'Missing routes or IGW attachments cause outbound failures.',
      x: 870,
      y: 220,
      group: 'base',
      category: 'edge',
      icon: 'igw',
    },
    {
      id: 'alb',
      label: 'ALB Ingress',
      description: 'Ingress controller for routing traffic into EKS.',
      why: 'Separates edge traffic from the cluster and enables HTTPS routing rules.',
      security: 'Managed security groups control inbound traffic to the cluster.',
      failure: 'Check target group health when responses are 5xx or 4xx.',
      x: 480,
      y: 360,
      group: 'base',
      category: 'edge',
      icon: 'alb',
    },
    {
      id: 'eks-frontend',
      label: 'EKS / Frontend (Nginx)',
      description: 'Hosts the static React SPA behind Nginx.',
      why: 'Keeps the lab focused on infra and auth without a custom backend.',
      security: 'No secrets are baked into the image; runtime config is read-only.',
      failure: 'Watch pod health and Nginx logs for asset routing issues.',
      x: 480,
      y: 540,
      group: 'base',
      category: 'compute',
      icon: 'eks',
    },
    {
      id: 'cognito',
      label: 'Cognito User Pool',
      description: 'Handles OAuth2 authentication and JWT issuance.',
      why: 'Provides managed auth so the lab can focus on architecture patterns.',
      security: 'JWTs are validated by AppSync; no passwords flow through the UI.',
      failure: 'Hosted UI misconfigurations appear as callback or token errors.',
      x: 1180,
      y: 330,
      group: 'core',
      category: 'auth',
      icon: 'cognito',
    },
    {
      id: 'appsync',
      label: 'AppSync GraphQL API',
      description: 'GraphQL facade that orchestrates Up Bank calls.',
      why: 'Centralizes API policy, caching, and request mapping.',
      security: 'Authorizes via Cognito and restricts access with least privilege.',
      failure: 'Resolver errors show up as GraphQL errors; check pipeline steps.',
      x: 1180,
      y: 450,
      group: 'core',
      category: 'compute',
      icon: 'appsync',
    },
    {
      id: 'dynamodb',
      label: 'DynamoDB Token Registry',
      description: 'Stores the user-scoped Up PAT for downstream calls.',
      why: 'Demonstrates a secure token vault with per-user ownership.',
      security: 'Encrypted at rest; tokens never return to the UI once saved.',
      failure: 'Missing or invalid tokens surface as 401s in GraphQL calls.',
      x: 1180,
      y: 570,
      group: 'core',
      category: 'data',
      icon: 'dynamodb',
    },
    {
      id: 'up-api',
      label: 'Up Bank API',
      description: 'External dependency that returns account data.',
      why: 'Adds real-world constraints and rate-limits to the lab.',
      security: 'Calls are made server-side using the stored PAT.',
      failure: 'Expect 429s or 5xx when the external API is unavailable.',
      x: 1410,
      y: 450,
      group: 'base',
      category: 'external',
      icon: 'api',
    },
    {
      id: 'observability',
      label: 'Prometheus / Grafana',
      description: 'Metrics and dashboards for EKS and app health.',
      why: 'Observability is a first-class outcome of the lab.',
      security: 'Dashboards are protected behind cluster auth and scoped permissions.',
      failure: 'Missing metrics usually mean scraping or service discovery issues.',
      x: 980,
      y: 560,
      group: 'observability',
      category: 'ops',
      icon: 'cloudwatch',
    },
    {
      id: 'nat-gateway',
      label: 'NAT Gateway',
      description: 'Provides outbound internet access for private subnets.',
      why: 'Lets private workloads reach external services without public IPs.',
      security: 'Keeps workloads private while enabling egress.',
      failure: 'Missing routes or exhausted NAT can block outbound traffic.',
      x: 980,
      y: 360,
      group: 'base',
      category: 'edge',
      icon: 'nat',
    },
  ],
  edges: [
    { id: 'browser-route53', from: 'browser', to: 'route53', group: 'base' },
    { id: 'route53-alb', from: 'route53', to: 'alb', group: 'base' },
    { id: 'route53-cognito', from: 'route53', to: 'cognito', group: 'base' },
    { id: 'route53-appsync', from: 'route53', to: 'appsync', group: 'base' },
    { id: 'acm-alb', from: 'acm', to: 'alb', group: 'base' },
    { id: 'acm-cognito', from: 'acm', to: 'cognito', group: 'base' },
    { id: 'acm-appsync', from: 'acm', to: 'appsync', group: 'base' },
    { id: 'alb-eks', from: 'alb', to: 'eks-frontend', group: 'base' },
    { id: 'eks-cognito', from: 'eks-frontend', to: 'cognito', group: 'base' },
    { id: 'cognito-appsync', from: 'cognito', to: 'appsync', group: 'core' },
    { id: 'appsync-dynamo', from: 'appsync', to: 'dynamodb', group: 'core' },
    { id: 'appsync-up', from: 'appsync', to: 'up-api', group: 'base' },
    { id: 'eks-observability', from: 'eks-frontend', to: 'observability', group: 'observability' },
    { id: 'eks-nat', from: 'eks-frontend', to: 'nat-gateway', group: 'base' },
    { id: 'nat-igw', from: 'nat-gateway', to: 'internet-gateway', group: 'base' },
  ],
}
