import { useEffect, useRef, useState, useMemo } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import './LandingZonePage.css'
import { architectureConfig } from '../config/architecture'
import type { ArchitectureEdge, ArchitectureNode } from '../config/architecture'
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
            A portfolio-grade lab focused on Cognito + AppSync + DynamoDB token vault,
            deployed on EKS.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#get-started">
              Get Started
            </a>
            <a className="button secondary" href="#architecture">
              Explore the Architecture
            </a>
            <a className="button secondary" href="/app">
              Go to App
            </a>
          </div>
          <div className="hero-meta">
            <span>Read-only React UI</span>
            <span>AppSync GraphQL</span>
            <span>DynamoDB token registry</span>
            <span>EKS + ALB</span>
          </div>
        </div>
        <div className="hero-card">
          <p className="eyebrow">Lab Snapshot</p>
          <h2>Secure, observable, and intentionally realistic.</h2>
          <p>
            This lab is designed to mirror production AWS patterns while staying easy to
            reason about. You authenticate with Cognito, register a PAT once, and then
            explore the architecture like a systems reviewer.
          </p>
          <div className="hero-highlights">
            <div>
              <strong>Auth</strong>
              <span>Cognito + JWT</span>
            </div>
            <div>
              <strong>API</strong>
              <span>AppSync GraphQL</span>
            </div>
            <div>
              <strong>Data</strong>
              <span>DynamoDB registry</span>
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
          <li>Demonstrate an end-to-end AWS setup with secure auth + GraphQL</li>
          <li>Practice real-world patterns: token registry, least privilege, observability</li>
          <li>Show infrastructure as a first-class feature via interactive diagram</li>
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
          <li>Sign in with Cognito.</li>
          <li>
            Register your PAT (paste it once; store securely in token registry; never show
            full token again).
          </li>
          <li>After registration, the UI becomes read-only and can query account summaries.</li>
        </ol>
      </section>

      <section className="landing-grid">
        <section className="landing-panel" id="learn">
          <div className="section-header">
            <p className="eyebrow">What you will learn</p>
            <h2>What you'll learn</h2>
          </div>
          <ul className="learning-list">
            <li>
              <strong>AuthN/AuthZ:</strong> Cognito + JWT
            </li>
            <li>
              <strong>API layer:</strong> AppSync resolvers
            </li>
            <li>
              <strong>Data:</strong> DynamoDB single-table design basics (pk/sk)
            </li>
            <li>
              <strong>Networking:</strong> domain + TLS + ALB ingress
            </li>
            <li>
              <strong>Ops:</strong> basic monitoring hooks
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
              <strong>Phase 0:</strong> Stand up the VPC + EKS baseline with a simple Nginx
              hello-world deployment.
            </li>
            <li>
              <strong>Phase 1:</strong> Validate ingress, TLS, and routing through Route53
              + ACM + ALB.
            </li>
            <li>
              <strong>Phase 2:</strong> Add observability (Prometheus/Grafana) to surface
              cluster health and app metrics.
            </li>
            <li>
              <strong>Phase 3:</strong> Introduce Cognito auth + AppSync, then wire
              DynamoDB for PAT storage.
            </li>
            <li>
              <strong>Phase 4:</strong> Harden and evolve: move from raw Kubernetes YAML
              toward Kustomize, then Helm chart packaging.
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

  const isHighlighted = () => true

  const getEdgePoints = (from: ArchitectureNode, to: ArchitectureNode) => {
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.hypot(dx, dy) || 1
    const inset = 100
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
                  const highlighted = isHighlighted(edge.group)
                  const { startX, startY, endX, endY } = getEdgePoints(from, to)
                  return (
                    <line
                      key={edge.id}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      className={`diagram-edge ${edge.group} ${highlighted ? 'is-active' : 'is-muted'}`}
                      markerEnd="url(#arrow)"
                    />
                  )
                })}
            </svg>
            {nodes.map((node) => {
              const highlighted = isHighlighted(node.group)
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
