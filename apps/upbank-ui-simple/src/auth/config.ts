export type AuthConfig = {
  cognitoDomain: string
  clientId: string
  redirectUri: string
  logoutUri: string
  scopes: string
  appSyncUrl: string
}

const requiredKeys: Array<keyof AuthConfig> = [
  'cognitoDomain',
  'clientId',
  'redirectUri',
  'logoutUri',
  'scopes',
  'appSyncUrl',
]

const envMap: Record<keyof AuthConfig, string> = {
  cognitoDomain: 'VITE_COGNITO_DOMAIN',
  clientId: 'VITE_COGNITO_CLIENT_ID',
  redirectUri: 'VITE_COGNITO_REDIRECT_URI',
  logoutUri: 'VITE_COGNITO_LOGOUT_URI',
  scopes: 'VITE_COGNITO_SCOPES',
  appSyncUrl: 'VITE_APPSYNC_URL',
}

const readEnv = (key: keyof AuthConfig) => {
  const envKey = envMap[key]
  const value = import.meta.env[envKey]
  if (!value || typeof value !== 'string') {
    throw new Error(
      `Missing required environment variable ${envKey}. Please set it in .env.local.`,
    )
  }
  return value.trim()
}

const trimTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value

const config: AuthConfig = requiredKeys.reduce((acc, key) => {
  const rawValue = readEnv(key)
  const value =
    key === 'cognitoDomain' || key === 'appSyncUrl'
      ? trimTrailingSlash(rawValue)
      : rawValue
  return { ...acc, [key]: value }
}, {} as AuthConfig)

export default config
