import config from './config'
import {
  clearStoredVerifier,
  generateChallenge,
  generateVerifier,
  storeVerifier,
} from './pkce'

const buildAuthorizeParams = async () => {
  const verifier = generateVerifier()
  storeVerifier(verifier)
  const challenge = await generateChallenge(verifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: crypto.randomUUID(),
  })

  return params
}

export const login = async () => {
  clearStoredVerifier()
  const params = await buildAuthorizeParams()
  window.location.href = `${config.cognitoDomain}/oauth2/authorize?${params.toString()}`
}

export const logout = () => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: config.logoutUri,
  })

  return `${config.cognitoDomain}/logout?${params.toString()}`
}
