export type ThemeName = 'default' | 'vivid'

const normalizeTheme = (value: string | undefined): ThemeName => {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'vivid' || normalized === 'vivid-blue' || normalized === 'blue') {
    return 'vivid'
  }
  return 'vivid'
}

export const resolveTheme = (): ThemeName => {
  return normalizeTheme(import.meta.env.VITE_THEME as string | undefined)
}

export const applyTheme = () => {
  if (typeof document === 'undefined') return 'default'
  const theme = resolveTheme()
  document.documentElement.dataset.theme = theme
  return theme
}
