import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RuntimeConfigGate from './components/RuntimeConfigGate.tsx'
import { applyTheme } from './config/theme.ts'

applyTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RuntimeConfigGate>
      <App />
    </RuntimeConfigGate>
  </StrictMode>,
)
