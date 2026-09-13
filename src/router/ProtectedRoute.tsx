import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import CrearPasswordBloqueo from '@/components/auth/CrearPasswordBloqueo/CrearPasswordBloqueo'

import { AtmosphericLoading } from '@/components/ui'

interface Props {
  mode?: 'app' | 'onboarding' | 'auth-only' | 'admin'
}

export default function ProtectedRoute({ mode = 'app' }: Props) {
  const { usuario, isAuthenticated, isLoading, is_admin } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AtmosphericLoading text="Verificando sesión..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (usuario && !usuario.password_configurada) {
    return <CrearPasswordBloqueo usuario={usuario} />
  }


  if (mode === 'admin') {
    if (!is_admin) {
      return <Navigate to="/app/dashboard" replace />
    }
  }

  if (mode === 'onboarding' && usuario?.onboarding_completo) {
    return <Navigate to="/app/dashboard" replace />
  }

  if (mode === 'app' && !usuario?.onboarding_completo) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
