import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchRegistrationStatus } from '../api/appsync'
import { clearTokens, getUserProfile, hasValidSession } from '../auth/tokenStore'
import { login, logout as buildLogoutUrl } from '../auth/oauth'

const Landing = () => {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthed = hasValidSession()
  const profile = isAuthed ? getUserProfile() : null

  useEffect(() => {
    const redirectIfNeeded = async () => {
      if (!isAuthed) return
      setChecking(true)
      setError(null)
      try {
        const registered = await fetchRegistrationStatus()
        navigate(registered ? '/app' : '/register-token', { replace: true })
      } catch (err) {
        setError((err as Error).message || 'Unable to verify registration status.')
      } finally {
        setChecking(false)
      }
    }

    redirectIfNeeded()
  }, [isAuthed, navigate])

  const handleLogout = () => {
    clearTokens()
    window.location.href = buildLogoutUrl()
  }

  return (
    <div className="card">
      <header>
        <div>
          <span className="badge">UpBank Labs</span>
          <h1>Secure your UpBank token</h1>
          <p>Authenticate with Cognito and register your UpBank token to continue.</p>
        </div>
        {profile && (
          <div className="status-pill ok">
            <span>Signed in</span>
            <strong>{profile.email ?? profile.sub}</strong>
          </div>
        )}
      </header>

      <div className="actions">
        {!isAuthed ? (
          <button className="button primary" onClick={() => login()} disabled={checking}>
            Sign in
          </button>
        ) : (
          <>
            <button
              className="button primary"
              disabled={checking}
              onClick={() => navigate('/app')}
            >
              Continue
            </button>
            <button className="button secondary" onClick={handleLogout} disabled={checking}>
              Logout
            </button>
          </>
        )}
      </div>

      {checking && <p className="hint">Checking your registration status...</p>}
      {error && (
        <p className="hint">
          {error} Try the Continue button again or logout to restart sign in.
        </p>
      )}
    </div>
  )
}

export default Landing
