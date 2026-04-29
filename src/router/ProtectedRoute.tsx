import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * mode='auth-only'  → solo requiere estar autenticado
 * mode='onboarding' → requiere auth; si onboarding_completo redirige a /app/dashboard
 * mode='app'        → requiere auth + onboarding_completo; si no, redirige a /onboarding
 */
interface Props {
  mode?: 'app' | 'onboarding' | 'auth-only'
}

export default function ProtectedRoute({ mode = 'auth-only' }: Props) {
  const { isAuthenticated, isLoading, usuario } = useAuth()

  if (isLoading) return null

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (mode === 'onboarding' && usuario?.onboarding_completo) {
    return <Navigate to="/app/dashboard" replace />
  }

  if (mode === 'app' && !usuario?.onboarding_completo) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
