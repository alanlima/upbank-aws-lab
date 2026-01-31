import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchStatusAndMe } from '../api/appsync'
import { clearTokens, getUserProfile } from '../auth/tokenStore'
import { logout as buildLogoutUrl } from '../auth/oauth'

type UserProfile = {
  email?: string
  sub?: string
}

const AppHome = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [registered, setRegistered] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { registered: status, me } = await fetchStatusAndMe()
        setRegistered(status)
        setUser(me ?? getUserProfile())
        if (!status) {
          navigate('/register-token', { replace: true })
          return
        }
      } catch (err) {
        setError((err as Error).message || 'Unable to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [navigate])

  const handleLogout = () => {
    clearTokens()
    window.location.href = buildLogoutUrl()
  }

  return (
    <div className="card">
      <header>
        <div>
          <span className="badge">Profile</span>
          <h1>Your profile</h1>
          <p>Identity and session details for your UpBank integration.</p>
        </div>
        {registered !== null && (
          <div className={`status-pill ${registered ? 'ok' : 'warn'}`}>
            <span>{registered ? 'Token registered' : 'Registration needed'}</span>
          </div>
        )}
      </header>

      <div className="stack">
        <div className="panel">
          <h2>User</h2>
          {user ? (
            <ul style={{ paddingLeft: '1rem', margin: 0 }}>
              {user.email && <li>Email: {user.email}</li>}
              {user.sub && <li>Sub: {user.sub}</li>}
            </ul>
          ) : (
            <p className="hint">Loading your profile...</p>
          )}
        </div>

        <div className="panel">
          <h2>Session</h2>
          {loading ? (
            <p className="hint">Verifying registration status...</p>
          ) : registered ? (
            <p className="hint">Your UpBank token is registered and ready.</p>
          ) : (
            <p className="hint">
              We could not confirm your token. You will be redirected to complete registration.
            </p>
          )}
        </div>

        {error && (
          <div className="panel">
            <h2>Errors</h2>
            <p className="hint">{error}</p>
          </div>
        )}

        <div className="actions">
          <button className="button primary" onClick={() => navigate('/app/accounts')}>
            Back to accounts
          </button>
          <button className="button secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppHome
