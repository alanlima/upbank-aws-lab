import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppHome from './pages/AppHome'
import Accounts from './pages/Accounts'
import AccountDetails from './pages/AccountDetails'
import Callback from './pages/Callback'
import Landing from './pages/Landing'
import RegisterToken from './pages/RegisterToken'
import ProtectedRoute from './components/ProtectedRoute'
import BuildInfo from './components/BuildInfo'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/callback" element={<Callback />} />
          <Route
            path="/register-token"
            element={
              <ProtectedRoute>
                <RegisterToken />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/accounts/:id"
            element={
              <ProtectedRoute>
                <AccountDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/app/profile"
            element={
              <ProtectedRoute>
                <AppHome />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BuildInfo />
      </div>
    </BrowserRouter>
  )
}

export default App
