export type EnvConfig = {
  cognitoDomain: string
  clientId: string
  redirectUri: string
  logoutUri: string
  scopes: string
  appSyncUrl: string
}

const envMap: Record<keyof EnvConfig, string> = {
  cognitoDomain: 'VITE_COGNITO_DOMAIN',
  clientId: 'VITE_COGNITO_CLIENT_ID',
  redirectUri: 'VITE_COGNITO_REDIRECT_URI',
  logoutUri: 'VITE_COGNITO_LOGOUT_URI',
  scopes: 'VITE_COGNITO_SCOPES',
  appSyncUrl: 'VITE_APPSYNC_URL',
}

const trimTrailingSlash = (value: string) =>
  value.endsWith('/') ? value.slice(0, -1) : value

export const loadEnvConfig = (): EnvConfig => {
  const values = Object.entries(envMap).reduce((acc, [key, envKey]) => {
    const value = import.meta.env[envKey]
    if (!value || typeof value !== 'string') {
      throw new Error(`Missing required environment variable: ${envKey}`)
    }
    acc[key as keyof EnvConfig] = value.trim()
    return acc
  }, {} as EnvConfig)

  return {
    ...values,
    cognitoDomain: trimTrailingSlash(values.cognitoDomain),
    appSyncUrl: trimTrailingSlash(values.appSyncUrl),
  }
}
