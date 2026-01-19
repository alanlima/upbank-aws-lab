import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchRegistrationStatus, registerToken } from '../api/appsync'
import { clearTokens } from '../auth/tokenStore'
import { logout as buildLogoutUrl } from '../auth/oauth'

const RegisterToken = () => {
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      setLoading(true)
      setError(null)
      try {
        const registered = await fetchRegistrationStatus()
        if (registered) {
          navigate('/app', { replace: true })
          return
        }
      } catch (err) {
        setError((err as Error).message || 'Could not load registration status.')
      } finally {
        setLoading(false)
      }
    }

    checkStatus()
  }, [navigate])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const registered = await registerToken(token.trim())
      if (registered) {
        navigate('/app', { replace: true })
      }
    } catch (err) {
      setError((err as Error).message || 'Unable to register your token.')
    } finally {
      setSubmitting(false)
      setToken('')
    }
  }

  const handleLogout = () => {
    clearTokens()
    window.location.href = buildLogoutUrl()
  }

  return (
    <div className="card">
      <header>
        <div>
          <span className="badge">Token setup</span>
          <h1>Register your UpBank token</h1>
          <p>Paste your token to finish onboarding.</p>
        </div>
      </header>

      <div className="stack">
        <form onSubmit={handleSubmit} className="panel">
          <div className="field">
            <label htmlFor="token">UpBank API token</label>
            <textarea
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="paste your token here"
              rows={4}
              disabled={submitting || loading}
              required
            />
          </div>
          <div className="actions">
            <button
              className="button primary"
              type="submit"
              disabled={!token.trim() || submitting || loading}
            >
              {submitting ? 'Registering...' : 'Register token'}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={handleLogout}
              disabled={submitting || loading}
            >
              Logout
            </button>
          </div>
          {error && <p className="hint">{error}</p>}
          {loading && <p className="hint">Checking your current status...</p>}
        </form>
      </div>
    </div>
  )
}

export default RegisterToken
