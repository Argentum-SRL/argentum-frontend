import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  mode?: 'app' | 'onboarding' | 'auth-only'
}

export default function ProtectedRoute({ mode = 'app' }: Props) {
  const { usuario, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--page)]">
        <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (mode === 'onboarding' && usuario?.onboarding_completo) {
    return <Navigate to="/app/dashboard" replace />
  }

  if (mode === 'app' && !usuario?.onboarding_completo) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
