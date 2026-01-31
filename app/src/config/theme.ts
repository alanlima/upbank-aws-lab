export type ThemeName = 'default' | 'vivid'
export type ThemeMode = 'light' | 'dark'

const MODE_STORAGE_KEY = 'upbank-theme-mode'

const normalizeTheme = (value: string | undefined): ThemeName => {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'vivid' || normalized === 'vivid-blue' || normalized === 'blue') {
    return 'vivid'
  }
  return 'vivid'
}

const normalizeMode = (value: string | undefined): ThemeMode | null => {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'dark') return 'dark'
  if (normalized === 'light') return 'light'
  return null
}

const getStoredMode = (): ThemeMode | null => {
  if (typeof window === 'undefined') return null
  try {
    return normalizeMode(window.localStorage.getItem(MODE_STORAGE_KEY) ?? undefined)
  } catch {
    return null
  }
}

const setStoredMode = (mode: ThemeMode) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, mode)
  } catch {
    // Ignore storage errors
  }
}

export const resolveTheme = (): ThemeName => {
  return normalizeTheme(import.meta.env.VITE_THEME as string | undefined)
}

export const resolveMode = (): ThemeMode => {
  const stored = getStoredMode()
  if (stored) return stored

  const envMode = normalizeMode(import.meta.env.VITE_THEME_MODE as string | undefined)
  if (envMode) return envMode

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  return 'dark'
}

export const getThemeMode = (): ThemeMode => {
  if (typeof document === 'undefined') return 'light'
  const current = document.documentElement.dataset.mode
  return current === 'dark' ? 'dark' : 'light'
}

export const setThemeMode = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.mode = mode
  setStoredMode(mode)
}

export const toggleThemeMode = () => {
  const next = getThemeMode() === 'dark' ? 'light' : 'dark'
  setThemeMode(next)
  return next
}

export const applyTheme = () => {
  if (typeof document === 'undefined') return { theme: 'default', mode: 'light' }
  const theme = resolveTheme()
  const mode = resolveMode()
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.mode = mode
  return { theme, mode }
}
