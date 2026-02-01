export type ThemeName = 'classic' | 'vivid'
export type ThemeMode = 'light' | 'dark'

const MODE_STORAGE_KEY = 'upbank-theme-mode'
const THEME_STORAGE_KEY = 'upbank-theme-name'

const normalizeTheme = (value: string | undefined): ThemeName | null => {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'vivid' || normalized === 'vivid-blue' || normalized === 'blue') {
    return 'vivid'
  }
  if (normalized === 'classic' || normalized === 'default' || normalized === 'baseline') {
    return 'classic'
  }
  return null
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

const getStoredTheme = (): ThemeName | null => {
  if (typeof window === 'undefined') return null
  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY) ?? undefined)
  } catch {
    return null
  }
}

const setStoredTheme = (theme: ThemeName) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore storage errors
  }
}

export const resolveTheme = (): ThemeName => {
  const stored = getStoredTheme()
  if (stored) return stored

  const envTheme = normalizeTheme(import.meta.env.VITE_THEME as string | undefined)
  if (envTheme) return envTheme

  return 'vivid'
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

export const getThemeName = (): ThemeName => {
  if (typeof document === 'undefined') return 'vivid'
  const current = document.documentElement.dataset.theme
  if (current === 'classic' || current === 'default') return 'classic'
  if (current === 'vivid') return 'vivid'
  return 'vivid'
}

export const getThemeMode = (): ThemeMode => {
  if (typeof document === 'undefined') return 'light'
  const current = document.documentElement.dataset.mode
  return current === 'dark' ? 'dark' : 'light'
}

export const setThemeName = (theme: ThemeName) => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  setStoredTheme(theme)
}

export const setThemeMode = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.mode = mode
  setStoredMode(mode)
}

export const toggleThemeName = () => {
  const next = getThemeName() === 'vivid' ? 'classic' : 'vivid'
  setThemeName(next)
  return next
}

export const toggleThemeMode = () => {
  const next = getThemeMode() === 'dark' ? 'light' : 'dark'
  setThemeMode(next)
  return next
}

export const applyTheme = () => {
  if (typeof document === 'undefined') return { theme: 'vivid', mode: 'light' }
  const theme = resolveTheme()
  const mode = resolveMode()
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.mode = mode
  return { theme, mode }
}
