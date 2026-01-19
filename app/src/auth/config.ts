import type { EnvConfig } from '../config/envConfig'
import { loadEnvConfig } from '../config/envConfig'
import type { RuntimeConfig } from '../config/runtimeConfig'
import { getRuntimeConfig, shouldUseRuntimeConfig } from '../config/runtimeConfig'

export type AuthConfig = EnvConfig | RuntimeConfig

export const getAuthConfig = (): AuthConfig =>
  shouldUseRuntimeConfig() ? getRuntimeConfig() : loadEnvConfig()
