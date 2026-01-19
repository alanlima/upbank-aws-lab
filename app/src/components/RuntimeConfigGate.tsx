import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { loadRuntimeConfig, shouldUseRuntimeConfig } from '../config/runtimeConfig'

type RuntimeConfigGateProps = {
  children: ReactNode
}

const RuntimeConfigGate = ({ children }: RuntimeConfigGateProps) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!shouldUseRuntimeConfig()) {
      setLoading(false)
      return
    }

    loadRuntimeConfig()
      .catch((err: Error) => {
        setError(err.message || 'Unable to load runtime configuration.')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="app-shell">
        <div className="card">
          <h1>Loading configuration</h1>
          <p className="hint">Preparing the application...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app-shell">
        <div className="card">
          <h1>Configuration error</h1>
          <p className="hint">{error}</p>
          <p className="hint">Check your ConfigMap mount at /config/runtime-config.json.</p>
        </div>
      </div>
    )
  }

  return children
}

export default RuntimeConfigGate
