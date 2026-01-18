export type TokenSet = {
  idToken: string
  accessToken: string
  refreshToken?: string | null
  expiresAt: number
}

const TOKEN_KEY = 'auth_tokens'

const decodeJwt = (token: string) => {
  const [, payload] = token.split('.')
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const saveTokens = (data: {
  id_token: string
  access_token: string
  refresh_token?: string
  expires_in: number
}) => {
  const expiresAt = Date.now() + data.expires_in * 1000
  const tokenSet: TokenSet = {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
  }
  sessionStorage.setItem(TOKEN_KEY, JSON.stringify(tokenSet))
}

export const getTokens = (): TokenSet | null => {
  const stored = sessionStorage.getItem(TOKEN_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored) as TokenSet
  } catch {
    return null
  }
}

export const clearTokens = () => {
  sessionStorage.removeItem(TOKEN_KEY)
}

export const hasValidSession = () => {
  const tokens = getTokens()
  if (!tokens) return false
  return tokens.expiresAt > Date.now() && Boolean(tokens.idToken)
}

export const getIdToken = () => getTokens()?.idToken ?? null

export const getUserProfile = () => {
  const idToken = getIdToken()
  if (!idToken) return null
  const payload = decodeJwt(idToken)
  if (!payload) return null
  return {
    email: payload.email as string | undefined,
    sub: payload.sub as string | undefined,
  }
}
