import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RuntimeConfigGate from './components/RuntimeConfigGate.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RuntimeConfigGate>
      <App />
    </RuntimeConfigGate>
  </StrictMode>,
)
