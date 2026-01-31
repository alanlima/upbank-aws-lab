import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchRegistrationStatus } from '../api/appsync'
import { getAuthConfig } from '../auth/config'
import { clearStoredVerifier, getStoredVerifier } from '../auth/pkce'
import { saveTokens } from '../auth/tokenStore'

type ViewState = {
  status: 'loading' | 'error'
  message?: string
}

const Callback = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [state, setState] = useState<ViewState>({ status: 'loading' })

  useEffect(() => {
    const exchangeCode = async () => {
      const config = getAuthConfig()
      const code = searchParams.get('code')
      const verifier = getStoredVerifier()

      if (!code) {
        setState({ status: 'error', message: 'Missing authorization code.' })
        return
      }

      if (!verifier) {
        setState({
          status: 'error',
          message: 'Missing PKCE verifier. Please start the sign in flow again.',
        })
        return
      }

      try {
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: config.clientId,
          code,
          redirect_uri: config.redirectUri,
          code_verifier: verifier,
        })

        const response = await fetch(`${config.cognitoDomain}/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        })

        const json = await response.json()
        if (!response.ok) {
          const message = json?.error_description ?? 'Token exchange failed.'
          throw new Error(message)
        }

        saveTokens(json)
        clearStoredVerifier()

        const registered = await fetchRegistrationStatus()
        navigate(registered ? '/app/accounts' : '/register-token', { replace: true })
      } catch (err) {
        setState({
          status: 'error',
          message: (err as Error).message || 'Unable to sign you in right now.',
        })
      }
    }

    exchangeCode()
  }, [navigate, searchParams])

  return (
    <div className="card">
      <h1>Signing you in</h1>
      {state.status === 'loading' && <p>Please wait while we complete your login.</p>}
      {state.status === 'error' && (
        <div className="stack">
          <p className="hint">{state.message}</p>
          <a className="link" href="/">
            Return home
          </a>
        </div>
      )}
    </div>
  )
}

export default Callback
