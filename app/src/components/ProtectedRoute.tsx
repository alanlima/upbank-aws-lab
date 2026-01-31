import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { hasValidSession } from '../auth/tokenStore'

type ProtectedRouteProps = {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const location = useLocation()
  const isAuthed = hasValidSession()

  if (!isAuthed) {
    return <Navigate to="/home" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedRoute
