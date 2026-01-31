import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAccounts, fetchStatusAndMe, type UpAccount } from '../api/appsync'
import { clearTokens, getUserProfile } from '../auth/tokenStore'
import { logout as buildLogoutUrl } from '../auth/oauth'

type UserProfile = {
  email?: string
  sub?: string
}

const formatDate = (value: string | null) => {
  if (!value) return 'Created date unavailable'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'Created date unavailable'
  return parsed.toLocaleDateString()
}

const IconEye = ({ crossed = false }: { crossed?: boolean }) => (
  <svg viewBox="0 0 20 20" role="presentation" aria-hidden="true">
    <path
      d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="10"
      cy="10"
      r="2.6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {crossed && (
      <path
        d="m4 4 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    )}
  </svg>
)

const IconUser = () => (
  <svg viewBox="0 0 20 20" role="presentation" aria-hidden="true">
    <circle
      cx="10"
      cy="6.5"
      r="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 16c0-2.4 2.7-4.2 6-4.2s6 1.8 6 4.2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const IconLogout = () => (
  <svg viewBox="0 0 20 20" role="presentation" aria-hidden="true">
    <path
      d="M11 4.5H6.5A1.5 1.5 0 0 0 5 6v8a1.5 1.5 0 0 0 1.5 1.5H11"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m12.5 7 3 3-3 3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 10H9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const IconArrowRight = () => (
  <svg viewBox="0 0 20 20" role="presentation" aria-hidden="true">
    <path
      d="m9 5 5 5-5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M6 10h8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const Accounts = () => {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<UpAccount[]>([])
  const [selected, setSelected] = useState<UpAccount | null>(null)
  const [registered, setRegistered] = useState<boolean | null>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBalances, setShowBalances] = useState(true)

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
        const data = await fetchAccounts()
        setAccounts(data)
        setSelected((prev) => prev ?? data[0] ?? null)
      } catch (err) {
        setError((err as Error).message || 'Unable to load your accounts.')
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

  const groupedAccounts = useMemo(() => {
    const groups: Record<string, UpAccount[]> = {}
    accounts.forEach((acct) => {
      const key = acct.accountType || 'Other'
      if (!groups[key]) groups[key] = []
      groups[key].push(acct)
    })
    return groups
  }, [accounts])

  const groupedEntries = Object.entries(groupedAccounts)

  return (
    <div className="card">
      <header>
        <div>
          <span className="badge">Accounts</span>
          <h1>Welcome back</h1>
          <p>Browse your UpBank accounts and drill into the details.</p>
        </div>
        {registered !== null && (
          <div className={`status-pill ${registered ? 'ok' : 'warn'}`}>
            <span>{registered ? 'Token registered' : 'Registration needed'}</span>
          </div>
        )}
      </header>

      <div className="actions">
        <div className="user-chip">
          <div className="dot" />
          <div>
            <div className="user-label">Signed in</div>
            <div className="user-value">{user?.email ?? user?.sub ?? 'Checking...'}</div>
          </div>
        </div>
        <div className="actions-gap" />
        <button
          className="button secondary button-compact with-icon"
          type="button"
          onClick={() => setShowBalances((prev) => !prev)}
          aria-pressed={showBalances}
        >
          <span className="button-icon" aria-hidden="true">
            <IconEye crossed={showBalances} />
          </span>
          {showBalances ? 'Hide balances' : 'Show balances'}
        </button>
        <button className="button secondary button-compact with-icon" onClick={() => navigate('/app/profile')}>
          <span className="button-icon" aria-hidden="true">
            <IconUser />
          </span>
          Profile
        </button>
        <button className="button secondary button-compact with-icon" onClick={handleLogout}>
          <span className="button-icon" aria-hidden="true">
            <IconLogout />
          </span>
          Logout
        </button>
      </div>

      <div className="stack">
        {error && (
          <div className="panel">
            <h2>Something went wrong</h2>
            <p className="hint">{error}</p>
          </div>
        )}

        <div className="panel">
          <div className="panel-header">
            <h2>Your accounts</h2>
            <span className="count-pill">
              {loading ? 'Loading...' : `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'}`}
            </span>
          </div>

          {loading && <p className="hint">Fetching your latest balances...</p>}

          {!loading && accounts.length === 0 && (
            <p className="hint">No accounts available for this token.</p>
          )}

          {!loading && accounts.length > 0 && (
            <div className="split">
              <div className="panel list-panel">
                <div className="list-header">
                  <p className="eyebrow">Accounts</p>
                  <span className="hint">{accounts.length} available</span>
                </div>
                <div className="account-list">
                  {groupedEntries.map(([type, items]) => (
                    <div key={type} className="account-group">
                      <div className="group-title">
                        <p className="eyebrow">{type}</p>
                        <span className="count-pill small">{items.length}</span>
                      </div>
                      {items.map((account) => {
                        const isActive = selected?.id === account.id
                        return (
                          <button
                            key={account.id}
                            className={`account-list-item ${isActive ? 'active' : ''}`}
                            onClick={() => setSelected(account)}
                          >
                            <div>
                              <strong>{account.displayName ?? 'Untitled account'}</strong>
                              <p className="mono small">
                                {showBalances && account.balanceValue ? (
                                  <>
                                    <span className="balance-amount">{account.balanceValue}</span>{' '}
                                    <span className="balance-currency">
                                      {account.currencyCode ?? ''}
                                    </span>
                                  </>
                                ) : showBalances ? (
                                  'Balance unavailable'
                                ) : (
                                  'Hidden'
                                )}
                              </p>
                            </div>
                            <div className="list-meta">
                              <span className="account-chip small">
                                {account.ownershipType ?? 'Unknown'}
                              </span>
                              <span className="mono small date-value">
                                {formatDate(account.createdAt)}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel detail-peek">
                {selected ? (
                  <>
                    <div className="panel-header detail-header">
                      <div>
                        <p className="eyebrow">{selected.accountType ?? 'Account'}</p>
                        <h2>{selected.displayName ?? 'Untitled account'}</h2>
                      </div>
                      <div className="detail-actions">
                        <button
                          className="button secondary with-icon"
                          onClick={() =>
                            navigate(`/app/accounts/${encodeURIComponent(selected.id)}`)
                          }
                        >
                          <span className="button-icon" aria-hidden="true">
                            <IconArrowRight />
                          </span>
                          View full details
                        </button>
                        <span className="account-chip">{selected.ownershipType ?? 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="detail-grid">
                      <div>
                        <p className="eyebrow">Balance</p>
                        <strong className="balance">
                          {showBalances && selected.balanceValue ? (
                            <>
                              <span className="balance-amount">{selected.balanceValue}</span>{' '}
                              <span className="balance-currency">
                                {selected.currencyCode ?? ''}
                              </span>
                            </>
                          ) : showBalances ? (
                            'Unavailable'
                          ) : (
                            'Hidden'
                          )}
                        </strong>
                      </div>
                      <div>
                        <p className="eyebrow">Created</p>
                        <p className="mono date-value">{formatDate(selected.createdAt)}</p>
                      </div>
                    </div>
                    <div className="transactions-placeholder">
                      <div>
                        <p className="eyebrow">Transactions</p>
                        <h3>Coming soon</h3>
                        <p className="hint">We will surface recent activity and insights here.</p>
                      </div>
                      <div className="placeholder-tiles">
                        <div className="placeholder-tile" />
                        <div className="placeholder-tile" />
                        <div className="placeholder-tile" />
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="hint">Select an account to preview its details.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Accounts
