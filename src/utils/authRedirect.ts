import type { NavigateFunction } from 'react-router-dom'
import type { AuthResponse } from '../types'
import { setToken, setRefreshToken } from '../lib/auth'

export function manejarRespuestaAuth(respuesta: AuthResponse, navigate: NavigateFunction): void {
  if (respuesta.access_token) setToken(respuesta.access_token)
  if (respuesta.refresh_token) setRefreshToken(respuesta.refresh_token)

  if (respuesta.requiere_telefono) {
    navigate('/auth/verificar-telefono', { replace: true })
  } else if (respuesta.requiere_datos) {
    navigate('/auth/completar-perfil', { replace: true })
  } else if (respuesta.requiere_verificacion_email) {
    navigate('/auth/verificar-email', {
      replace: true,
      state: { email: respuesta.usuario?.email },
    })
  } else if (respuesta.requiere_verificacion_telefono) {
    navigate('/auth/verificar-telefono', {
      replace: true,
      state: { telefono: respuesta.usuario?.telefono, modoVerificacion: true },
    })
  } else if (respuesta.requiere_onboarding) {
    navigate('/onboarding', { replace: true })
  } else {
    navigate('/app/dashboard', { replace: true })
  }
}
