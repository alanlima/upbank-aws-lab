import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchAccountById, fetchStatusAndMe, type UpAccount } from '../api/appsync'
import { clearTokens } from '../auth/tokenStore'
import { logout as buildLogoutUrl } from '../auth/oauth'

const formatDate = (value: string | null) => {
  if (!value) return 'Not available'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Not available'
  return parsed.toLocaleString()
}

const AccountDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [account, setAccount] = useState<UpAccount | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setError('Missing account identifier.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const { registered } = await fetchStatusAndMe()
        if (!registered) {
          navigate('/register-token', { replace: true })
          return
        }
        const data = await fetchAccountById(id)
        if (!data) {
          setError('Account not found.')
          return
        }
        setAccount(data)
      } catch (err) {
        setError((err as Error).message || 'Unable to load account.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [id, navigate])

  const handleLogout = () => {
    clearTokens()
    window.location.href = buildLogoutUrl()
  }

  return (
    <div className="card">
      <header>
        <div>
          <span className="badge">Account</span>
          <h1>{account?.displayName ?? 'Account details'}</h1>
          <p>Review account metadata. Transactions will appear here soon.</p>
        </div>
        <div className="header-actions">
          <button className="button secondary" onClick={() => navigate('/app')}>
            Back to accounts
          </button>
          <button className="button secondary" onClick={() => navigate('/app/profile')}>
            Profile
          </button>
          <button className="button secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="stack">
        {error && (
          <div className="panel">
            <h2>Issue loading account</h2>
            <p className="hint">{error}</p>
          </div>
        )}

        {loading && <p className="hint">Fetching account information...</p>}

        {!loading && account && (
          <>
            <div className="panel detail-grid">
              <div>
                <p className="eyebrow">Account type</p>
                <strong>{account.accountType ?? 'Unknown'}</strong>
              </div>
              <div>
                <p className="eyebrow">Ownership</p>
                <strong>{account.ownershipType ?? 'Unknown'}</strong>
              </div>
              <div>
                <p className="eyebrow">Balance</p>
                <strong>
                  {account.balanceValue
                    ? `${account.balanceValue} ${account.currencyCode ?? ''}`.trim()
                    : 'Unavailable'}
                </strong>
              </div>
              <div>
                <p className="eyebrow">Base units</p>
                <span className="mono">
                  {account.balanceValueInBaseUnits !== null
                    ? `${account.balanceValueInBaseUnits} ${account.currencyCode ?? ''}`.trim()
                    : 'Not provided'}
                </span>
              </div>
              <div>
                <p className="eyebrow">Created</p>
                <span className="mono">{formatDate(account.createdAt)}</span>
              </div>
              <div>
                <p className="eyebrow">Account ID</p>
                <span className="mono">{account.id}</span>
              </div>
            </div>

            <div className="panel transactions-placeholder">
              <div>
                <p className="eyebrow">Transactions</p>
                <h2>Coming soon</h2>
                <p className="hint">
                  We are preparing to surface your recent activity and insights here.
                </p>
              </div>
              <div className="placeholder-tiles">
                <div className="placeholder-tile" />
                <div className="placeholder-tile" />
                <div className="placeholder-tile" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AccountDetails
