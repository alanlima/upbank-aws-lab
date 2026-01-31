import { useEffect, useRef, useState, useMemo } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import './LandingZonePage.css'
import { architectureConfig } from '../config/architecture'
import type { ArchitectureGroup, ArchitectureNode } from '../config/architecture'
import {
  AwsAlbIcon,
  AwsApiGatewayIcon,
  AwsAppSyncIcon,
  AwsCertificateManagerIcon,
  AwsCloudWatchIcon,
  AwsCognitoIcon,
  AwsDynamoDbIcon,
  AwsEksIcon,
  AwsInternetGatewayIcon,
  AwsNatGatewayIcon,
  AwsRoute53Icon,
  AwsUserIcon,
} from '../components/aws-icons/AwsIcons'

const LandingZonePage = () => {
  return (
    <div className="landing-zone">
      <section className="landing-hero" id="top">
        <div className="hero-copy">
          <span className="badge">UpBank Lab</span>
          <h1>UpBank Lab - AWS Architecture Study Case</h1>
          <p className="hero-subtitle">
            A portfolio-grade lab that blends managed AWS services, IaC-first infra, and
            CI/CD automation for a production-style Up Bank integration.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="/app">
              Go to App
            </a>
            <a className="button secondary" href="#get-started">
              Get Started
            </a>
            <a className="button secondary" href="#architecture">
              Explore the Architecture
            </a>
          </div>
          <div className="hero-meta">
            <span>Read-only React UI</span>
            <span>Terraform IaC</span>
            <span>GitHub Actions CI/CD</span>
            <span>EKS + ALB</span>
            <span>CloudFront + EC2</span>
            <span>Grafana + Prometheus</span>
          </div>
        </div>
        <div className="hero-card">
          <p className="eyebrow">Lab Snapshot</p>
          <h2>Secure, observable, and intentionally realistic.</h2>
          <p>
            The lab mirrors production AWS patterns with clear boundaries, zero-click
            operations using Terraform, and automated releases via GitHub Actions.
            You authenticate with Cognito, register a PAT once, and then explore the
            architecture like a systems reviewer.
          </p>
          <div className="hero-highlights">
            <div>
              <strong>Infra</strong>
              <span>EKS, EC2, ALB, CloudFront</span>
            </div>
            <div>
              <strong>API + Data</strong>
              <span>AppSync + DynamoDB</span>
            </div>
            <div>
              <strong>Observability</strong>
              <span>Grafana + Prometheus</span>
            </div>
            <div>
              <strong>IaC</strong>
              <span>Terraform (zero-click ops)</span>
            </div>
            <div>
              <strong>CI/CD</strong>
              <span>GitHub Actions pipelines</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-panel" id="purpose">
        <div className="section-header">
          <p className="eyebrow">Why this lab</p>
          <h2>What is this project for?</h2>
        </div>
        <ul className="bullet-grid">
          <li>Show a production-grade AWS architecture with clear request boundaries and managed services</li>
          <li>Practice Terraform-first infrastructure, zero-click ops, and repeatable CI/CD rollouts</li>
          <li>Model a secure Up Bank integration: token vaulting, least-privilege access, and audit-ready flows</li>
          <li>Teach how DNS, TLS, and routing shape frontend, API, and auth entry points</li>
          <li>Expose observability as a core requirement (metrics, dashboards, and failure modes)</li>
        </ul>
      </section>

      <section className="landing-panel" id="get-started">
        <div className="section-header">
          <p className="eyebrow">Onboarding</p>
          <h2>How to log on</h2>
        </div>
        <ol className="step-list">
          <li>You must have an Up Bank account.</li>
          <li>
            Generate a Personal Access Token (PAT) in the Up Developer Portal using the
            official getting started instructions.{' '}
            <a className="link" href="https://api.up.com.au/getting_started" target="_blank" rel="noreferrer">
              Learn how to get a PAT
            </a>
            .
          </li>
          <li>
            Go to the app and sign in. If you are new, choose “Register new user”.
          </li>
          <li>
            Email verification is required. Provide a valid email address and use the token
            sent to your inbox to verify the account.
          </li>
          <li>
            After registration, the UI prompts for your PAT. Paste the token and submit.
          </li>
          <li>
            Once the PAT is stored, the UI switches to read-only mode and can query your
            account information.
          </li>
        </ol>
        <div className="get-started-actions">
          <a className="button primary" href="/app">
            Go to App
          </a>
        </div>
      </section>

      <section className="landing-grid">
        <section className="landing-panel" id="learn">
          <div className="section-header">
            <p className="eyebrow">What you will learn</p>
            <h2>What you'll learn</h2>
          </div>
          <ul className="learning-list">
            <li>
              <strong>Frontend:</strong> ReactJS SPA patterns and state flow
            </li>
            <li>
              <strong>AuthN/AuthZ:</strong> Cognito, JWT, and protected UI flows
            </li>
            <li>
              <strong>API layer:</strong> AppSync resolvers and pipeline functions
            </li>
            <li>
              <strong>Data:</strong> DynamoDB access patterns and token vaulting
            </li>
            <li>
              <strong>Networking:</strong> Route53, ACM, ALB ingress, and egress via NAT
            </li>
            <li>
              <strong>Ops:</strong> Prometheus/Grafana, alerts, and failure triage
            </li>
            <li>
              <strong>Delivery:</strong> Terraform IaC and GitHub Actions pipelines
            </li>
            <li>
              <strong>Architecture:</strong> Public endpoints vs managed services vs VPC workloads
            </li>
          </ul>
        </section>
        <section className="landing-panel" id="approach">
          <div className="section-header">
            <p className="eyebrow">Experiment approach</p>
            <h2>How the lab was approached</h2>
            <p>
              Built as a progressive study case: start with infrastructure, then add auth,
              data, and observability one layer at a time.
            </p>
          </div>
          <ol className="step-list">
            <li>
              <strong>Phase 01:</strong> Stand up cluster, VPC, EKS with nginx hello world
              deployed via Kubernetes files + Prometheus/Grafana deployments.
            </li>
            <li>
              <strong>Phase 02:</strong> Monitoring with Prometheus/Grafana.
            </li>
            <li>
              <strong>Phase 03:</strong> Application / Auth Layer - stand up Cognito,
              AppSync, DynamoDB and a simple UI with a mock profile query via AppSync.
            </li>
            <li>
              <strong>Phase 04:</strong> UpBank integration - token registration, GraphQL
              pipeline resolvers to retrieve Up Bank API data, UI lists accounts.
            </li>
            <li>
              <strong>Phase 05:</strong> CI/CD - GitHub Actions workflows for infra and
              app rollout automation.
            </li>
            <li>
              <strong>Phase 06:</strong> Route53 setup with custom domains: `api.upbank-lab.*`
              (API), `auth.upbank-lab.*` (Auth), `upbank-lab.*` (UI).
            </li>
          </ol>
          <div className="section-header">
            <p className="eyebrow">Upcoming</p>
            <h3>Planned improvements</h3>
          </div>
          <ol className="step-list">
            <li>
              <strong>Phase 07:</strong> Infra improvements - move frontend config to
              Terraform + Parameter Store/S3; update infra to use Kustomize.
            </li>
            <li>
              <strong>Phase 08:</strong> Infra improvements - deploy frontend via Helm charts.
            </li>
            <li>
              <strong>Phase 09:</strong> Infra improvements - refactor Terraform into modular
              reusable components.
            </li>
            <li>
              <strong>Phase 10:</strong> UI improvements - add transactions support and
              notification configuration shell, plus Apollo Client integration for GraphQL.
            </li>
            <li>
              <strong>Phase 11:</strong> Webhooks/Notifications - implement transaction
              notifications via webhooks (settled/created/deleted), opt-in browser alerts
              via GraphQL realtime API, and email fallback.
            </li>
          </ol>
        </section>
      </section>

      <section className="landing-panel" id="architecture">
        <div className="section-header">
          <p className="eyebrow">Interactive view</p>
          <h2>Infrastructure view (interactive)</h2>
          <p>
            Uses the AWS architecture icons and standard region / subnet boundaries. Click a
            node to explore its role, security posture, and operational concerns.
            Use the toggles to highlight specific paths.
          </p>
        </div>
        <p className="hint">
          Diagram is aligned to AWS region, public subnet, and private subnet boundaries to
          mirror a common reference architecture layout.
        </p>
        <ArchitectureExplorer />
      </section>
    </div>
  )
}

const ArchitectureExplorer = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('browser')
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const shellRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  })

  const iconMap = useMemo(
    () => ({
      user: AwsUserIcon,
      route53: AwsRoute53Icon,
      acm: AwsCertificateManagerIcon,
      alb: AwsAlbIcon,
      eks: AwsEksIcon,
      cognito: AwsCognitoIcon,
      appsync: AwsAppSyncIcon,
      dynamodb: AwsDynamoDbIcon,
      cloudwatch: AwsCloudWatchIcon,
      igw: AwsInternetGatewayIcon,
      nat: AwsNatGatewayIcon,
      api: AwsApiGatewayIcon,
    }),
    [],
  )

  const nodes = architectureConfig.nodes
  const edges = architectureConfig.edges

  const nodeById = useMemo(() => {
    return nodes.reduce<Record<string, ArchitectureNode>>((acc, node) => {
      acc[node.id] = node
      return acc
    }, {})
  }, [nodes])

  useEffect(() => {
    if (!nodeById[selectedNodeId]) {
      setSelectedNodeId(nodes[0]?.id ?? '')
    }
  }, [nodeById, nodes, selectedNodeId])

  const selectedNode = nodeById[selectedNodeId]

  const handleZoom = (direction: 'in' | 'out') => {
    setViewport((prev) => {
      const delta = direction === 'in' ? 0.12 : -0.12
      const nextScale = Math.min(1.6, Math.max(0.65, prev.scale + delta))
      return { ...prev, scale: nextScale }
    })
  }

  const handleReset = () => {
    setViewport({ x: 0, y: 0, scale: 1 })
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleToggleFullscreen = async () => {
    if (!shellRef.current) return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await shellRef.current.requestFullscreen()
  }

  const isInteractiveElement = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false
    return Boolean(target.closest('.diagram-controls') || target.closest('.diagram-node'))
  }

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (isInteractiveElement(event.target)) return
    event.preventDefault()
    setViewport((prev) => {
      const delta = event.deltaY > 0 ? -0.08 : 0.08
      const nextScale = Math.min(1.6, Math.max(0.65, prev.scale + delta))
      return { ...prev, scale: nextScale }
    })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (isInteractiveElement(event.target)) return
    dragState.current = { active: true, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return
    const deltaX = event.clientX - dragState.current.x
    const deltaY = event.clientY - dragState.current.y
    dragState.current = { active: true, x: event.clientX, y: event.clientY }
    setViewport((prev) => ({ ...prev, x: prev.x + deltaX, y: prev.y + deltaY }))
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragState.current.active) return
    dragState.current = { ...dragState.current, active: false }
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const getEdgePoints = (from: ArchitectureNode, to: ArchitectureNode) => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.hypot(dx, dy) || 1
    const inset = 120
    const startOffset = Math.min(inset, distance * 0.3)
    const endOffset = Math.min(inset, distance * 0.3)
    const startX = from.x + (dx / distance) * startOffset
    const startY = from.y + (dy / distance) * startOffset
    const endX = to.x - (dx / distance) * endOffset
    const endY = to.y - (dy / distance) * endOffset
    return { startX, startY, endX, endY }
  }

  return (
    <div className="architecture-layout">
      <div className="diagram-column">
        <div
          className={`diagram-shell ${isFullscreen ? 'is-fullscreen' : ''}`}
          ref={shellRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="application"
          aria-label="Interactive infrastructure diagram"
        >
          <div
            className="diagram-canvas"
            style={{
              width: `${architectureConfig.width}px`,
              height: `${architectureConfig.height}px`,
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            }}
          >
            {architectureConfig.zones.map((zone) => (
              <div
                key={zone.id}
                className={`diagram-zone ${zone.tone}`}
                style={{
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                }}
              >
                <span className="zone-label">{zone.label}</span>
              </div>
            ))}
            <svg
              className="diagram-edges"
              viewBox={`0 0 ${architectureConfig.width} ${architectureConfig.height}`}
            >
              <defs>
                <marker
                  id="arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L6,3 z" fill="#1b7f7a" />
                </marker>
              </defs>
              {edges.map((edge) => {
                  const from = nodeById[edge.from]
                  const to = nodeById[edge.to]
                  if (!from || !to) return null
                  const { startX, startY, endX, endY } = getEdgePoints(from, to)
                  const midX = (startX + endX) / 2
                  const midY = (startY + endY) / 2
                  return (
                    <g key={edge.id}>
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        className={`diagram-edge ${edge.group}`}
                        markerEnd="url(#arrow)"
                      />
                      {edge.label && (
                        <text
                          x={midX}
                          y={midY - 8}
                          className="edge-label"
                          textAnchor="middle"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  )
                })}
            </svg>
            {nodes.map((node) => {
              const highlighted = true; // Future: add filtering/highlighting logic
              const isActive = node.id === selectedNodeId
              const Icon = node.icon ? iconMap[node.icon as keyof typeof iconMap] : null
              return (
                <button
                  key={node.id}
                  className={`diagram-node ${node.category} ${node.group} ${
                    highlighted ? 'is-active' : 'is-muted'
                  } ${isActive ? 'is-selected' : ''}`}
                  style={{ left: node.x, top: node.y }}
                  onClick={() => setSelectedNodeId(node.id)}
                  type="button"
                >
                  {Icon && (
                    <span className="node-icon" aria-hidden="true">
                      <Icon />
                    </span>
                  )}
                  <span className="node-label">{node.label}</span>
                </button>
              )
            })}
          </div>

          <div className="diagram-controls" onPointerDown={(event) => event.stopPropagation()}>
            <button className="button secondary button-compact" type="button" onClick={() => handleZoom('in')}>
              + Zoom
            </button>
            <button className="button secondary button-compact" type="button" onClick={() => handleZoom('out')}>
              - Zoom
            </button>
            <button className="button secondary button-compact" type="button" onClick={handleToggleFullscreen}>
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </button>
            <button className="button secondary button-compact" type="button" onClick={handleReset}>
              Reset view
            </button>
          </div>
        </div>
      </div>

      <aside className="node-details" aria-live="polite">
        {selectedNode ? (
          <>
            <p className="eyebrow">Selected node</p>
            <h3>{selectedNode.label}</h3>
            <p>{selectedNode.description}</p>
            <div className="detail-section">
              <h4>Why it exists</h4>
              <p>{selectedNode.why}</p>
            </div>
            <div className="detail-section">
              <h4>Security considerations</h4>
              <p>{selectedNode.security}</p>
            </div>
            <div className="detail-section">
              <h4>Failure modes / troubleshooting</h4>
              <p>{selectedNode.failure}</p>
            </div>
          </>
        ) : (
          <p>Select a node to see details.</p>
        )}
      </aside>
    </div>
  )
}

export default LandingZonePage
