export type RuntimeConfig = {
  cognitoDomain: string
  clientId: string
  redirectUri: string
  logoutUri: string
  scopes: string
  appSyncUrl: string
}

const useEnvConfigFlag = () => {
  const flag = import.meta.env.VITE_USE_ENV_CONFIG
  return flag === undefined || flag === null || flag === '' || flag === 'true'
}

export const shouldUseRuntimeConfig = () => !useEnvConfigFlag()

let cachedConfig: RuntimeConfig | null = null
let loadPromise: Promise<RuntimeConfig> | null = null

const normalize = (config: unknown): RuntimeConfig => {
  if (!config || typeof config !== 'object') {
    throw new Error('Runtime config is missing or malformed.')
  }

  const raw = config as Partial<RuntimeConfig>
  const requiredKeys: Array<keyof RuntimeConfig> = [
    'cognitoDomain',
    'clientId',
    'redirectUri',
    'logoutUri',
    'scopes',
    'appSyncUrl',
  ]

  const values = requiredKeys.reduce((acc, key) => {
    const value = raw[key]
    if (!value || typeof value !== 'string') {
      throw new Error(`Runtime config missing required key: ${key}`)
    }
    acc[key] = value.trim()
    return acc
  }, {} as Record<keyof RuntimeConfig, string>)

  const trimTrailingSlash = (value: string) =>
    value.endsWith('/') ? value.slice(0, -1) : value

  return {
    ...values,
    cognitoDomain: trimTrailingSlash(values.cognitoDomain),
    appSyncUrl: trimTrailingSlash(values.appSyncUrl),
  }
}

export const loadRuntimeConfig = async () => {
  if (cachedConfig) return cachedConfig
  if (loadPromise) return loadPromise

  loadPromise = fetch('/config/runtime-config.json', { cache: 'no-store' })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Unable to load runtime config (status ${response.status}). Ensure /config/runtime-config.json is mounted.`,
        )
      }
      const json = await response.json()
      cachedConfig = normalize(json)
      return cachedConfig
    })
    .catch((err) => {
      loadPromise = null
      throw err
    })

  return loadPromise
}

export const getRuntimeConfig = () => {
  if (!cachedConfig) {
    throw new Error('Runtime config not loaded yet.')
  }
  return cachedConfig
}
