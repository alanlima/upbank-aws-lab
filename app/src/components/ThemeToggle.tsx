import { useState } from 'react'
import { getThemeMode, getThemeName, setThemeMode, setThemeName } from '../config/theme'
import type { ThemeMode, ThemeName } from '../config/theme'

const SunIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
    <path
      d="M12 4.5a1 1 0 0 1 1 1V7a1 1 0 1 1-2 0V5.5a1 1 0 0 1 1-1zm0 11a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm7.5-4.5a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1zM12 17a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V18a1 1 0 0 1 1-1zM6.5 12a1 1 0 0 1 1 1v0a1 1 0 1 1-2 0v0a1 1 0 0 1 1-1zm10.95-5.45a1 1 0 0 1 1.41 0l.03.03a1 1 0 0 1-1.42 1.42l-.02-.02a1 1 0 0 1 0-1.43zM5.54 17.46a1 1 0 0 1 1.41 0l.03.03a1 1 0 0 1-1.42 1.42l-.02-.02a1 1 0 0 1 0-1.43zm0-10.92a1 1 0 0 1 1.43 0l.02.02a1 1 0 0 1-1.42 1.42l-.03-.03a1 1 0 0 1 0-1.41zm11.91 10.92a1 1 0 0 1 1.43 0 1 1 0 0 1 0 1.41l-.03.03a1 1 0 0 1-1.42-1.42l.02-.02z"
      fill="currentColor"
    />
  </svg>
)

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
    <path
      d="M21 15.5A8.5 8.5 0 1 1 8.5 3a7 7 0 0 0 8.4 12.5 1 1 0 0 1 1.22 1.5 8.6 8.6 0 0 1-5.12 2.3z"
      fill="currentColor"
    />
  </svg>
)

const PaletteIcon = () => (
  <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
    <path
      d="M12 3a9 9 0 1 0 0 18h2.2a2.3 2.3 0 0 0 0-4.6h-1.1a1.7 1.7 0 0 1 0-3.4h2.4A3.5 3.5 0 0 0 19 9.5 6.5 6.5 0 0 0 12 3zm-4 8.2a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm3.2-3a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm4.2 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z"
      fill="currentColor"
    />
  </svg>
)

const ThemeToggle = () => {
  const [mode, setMode] = useState<ThemeMode>(() => getThemeMode())
  const [theme, setTheme] = useState<ThemeName>(() => getThemeName())

  const handleToggleMode = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    setThemeMode(next)
  }

  const handleToggleTheme = () => {
    const next = theme === 'vivid' ? 'classic' : 'vivid'
    setTheme(next)
    setThemeName(next)
  }

  return (
    <div className="theme-toggle-group" role="group" aria-label="Theme toggles">
      <button
        className="theme-toggle"
        type="button"
        onClick={handleToggleMode}
        aria-pressed={mode === 'dark'}
        aria-label="Toggle dark mode"
      >
        <span className="theme-toggle__icon" aria-hidden="true">
          {mode === 'dark' ? <MoonIcon /> : <SunIcon />}
        </span>
        <span className="theme-toggle__label">
          {mode === 'dark' ? 'Dark mode' : 'Light mode'}
        </span>
      </button>
      <button
        className="theme-toggle"
        type="button"
        onClick={handleToggleTheme}
        aria-pressed={theme === 'vivid'}
        aria-label="Toggle color theme"
      >
        <span className="theme-toggle__icon" aria-hidden="true">
          <PaletteIcon />
        </span>
        <span className="theme-toggle__label">
          {theme === 'vivid' ? 'Vivid palette' : 'Classic palette'}
        </span>
      </button>
    </div>
  )
}

export default ThemeToggle
